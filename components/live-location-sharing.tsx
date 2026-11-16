import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, type AppStateStatus, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { ActionButton, Card, StatusPill } from "@/components/care-ui";
import * as Api from "@/lib/_core/api";
import { ApiError } from "@/lib/_core/api";
import { isValidLocationPoint, LOCATION_SHARING_CONSENT_VERSION, type SharedFamilyLocation } from "@/shared/location";
import { palette } from "@/lib/eldercare";

type CurrentPoint = { latitude: number; longitude: number; accuracy: number; updatedAt: string; serverConfirmedAt?: string };

function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : "Location sharing could not be completed.";
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "time unavailable" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function LiveLocationSharing() {
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [linkedFamilyCount, setLinkedFamilyCount] = useState(0);
  const [locations, setLocations] = useState<SharedFamilyLocation[]>([]);
  const [currentPoint, setCurrentPoint] = useState<CurrentPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const watchGenerationRef = useRef(0);
  const sharingGenerationRef = useRef<number | null>(null);
  const sharingEnabledRef = useRef(false);
  const uploadInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const stopWatcher = useCallback(() => {
    watchGenerationRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (mountedRef.current) setTracking(false);
  }, []);

  const startWatcher = useCallback(async (requestPermission: boolean): Promise<boolean> => {
    if (subscriptionRef.current) return true;
    const sharingGeneration = sharingGenerationRef.current;
    if (sharingGeneration === null || !sharingEnabledRef.current) {
      if (mountedRef.current) setError("Your current sharing consent could not be verified. Stop sharing and opt in again while online.");
      return false;
    }
    const watchGeneration = ++watchGenerationRef.current;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (mountedRef.current) setError("Turn on your device’s location service to share a live point.");
        return false;
      }
      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (mountedRef.current) setError("Location permission is not enabled. You can allow foreground location in device settings or stop sharing.");
        return false;
      }
      if (mountedRef.current) setCurrentPoint(null);
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15_000, distanceInterval: 25 },
        (position) => {
          if (!sharingEnabledRef.current || sharingGeneration !== sharingGenerationRef.current) return;
          const accuracy = position.coords.accuracy;
          const validPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: accuracy,
          };
          if (!isValidLocationPoint(validPoint)) {
            if (mountedRef.current) setError("Your device did not provide a valid location and accuracy reading. No point was shared.");
            return;
          }
          const point: CurrentPoint = {
            latitude: validPoint.latitude,
            longitude: validPoint.longitude,
            accuracy: validPoint.accuracyMeters,
            updatedAt: new Date(position.timestamp).toISOString(),
          };
          if (mountedRef.current) {
            setCurrentPoint(point);
            setError("");
          }
          if (uploadInProgressRef.current) return;
          uploadInProgressRef.current = true;
          void Api.uploadCurrentLocation({
            latitude: point.latitude,
            longitude: point.longitude,
            accuracyMeters: point.accuracy,
          }, sharingGeneration).then((result) => {
            if (mountedRef.current && sharingGeneration === sharingGenerationRef.current) {
              setCurrentPoint((current) => current?.updatedAt === point.updatedAt ? { ...current, serverConfirmedAt: result.receivedAt } : current);
              setMessage(`The server confirmed your latest location update at ${formatTime(result.receivedAt)}.`);
            }
          }).catch((uploadError: unknown) => {
            if (mountedRef.current && sharingGeneration === sharingGenerationRef.current) {
              setError(`Your device location is available, but the server did not confirm sharing. ${errorText(uploadError)}`);
            }
          }).finally(() => {
            uploadInProgressRef.current = false;
          });
        },
      );
      if (!mountedRef.current || watchGeneration !== watchGenerationRef.current || !sharingEnabledRef.current || sharingGeneration !== sharingGenerationRef.current) {
        subscription.remove();
        return false;
      }
      subscriptionRef.current = subscription;
      if (mountedRef.current) {
        setTracking(true);
        setError("");
      }
      return true;
    } catch (watchError) {
      if (mountedRef.current) setError(`Live location could not start. ${errorText(watchError)}`);
      return false;
    }
  }, []);

  const refreshFamilyLocations = useCallback(async () => {
    try {
      const nextLocations = await Api.getSharedFamilyLocations();
      if (mountedRef.current) setLocations(nextLocations);
    } catch (requestError) {
      if (mountedRef.current) {
        setLocations([]);
        setError(errorText(requestError));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    void Api.getLocationSharingState().then(async (result) => {
      if (!active) return;
      const validGeneration = result.enabled && Number.isSafeInteger(result.generation) && (result.generation ?? 0) > 0;
      sharingEnabledRef.current = validGeneration;
      sharingGenerationRef.current = validGeneration ? result.generation : null;
      setSharingEnabled(validGeneration);
      setLinkedFamilyCount(validGeneration ? result.linkedFamilyCount : 0);
      await refreshFamilyLocations();
      if (validGeneration) await startWatcher(false);
    }).catch((requestError: unknown) => {
      if (active) setError(errorText(requestError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      mountedRef.current = false;
      watchGenerationRef.current += 1;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [refreshFamilyLocations, startWatcher]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        stopWatcher();
        return;
      }
      if (sharingEnabledRef.current) void startWatcher(false);
      void refreshFamilyLocations();
    });
    return () => subscription.remove();
  }, [refreshFamilyLocations, startWatcher, stopWatcher]);

  useEffect(() => {
    const timer = setInterval(() => { void refreshFamilyLocations(); }, 30_000);
    return () => clearInterval(timer);
  }, [refreshFamilyLocations]);

  const enableSharing = async () => {
    if (!consentChecked) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Turn on your device’s location service before enabling sharing.");
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("You denied foreground location permission. No location was uploaded; change the permission in device settings if you want to share.");
        return;
      }
      const result = await Api.setLocationSharing({
        enabled: true,
        consent: true,
        consentVersion: LOCATION_SHARING_CONSENT_VERSION,
      });
      if (result.generation === null || !Number.isSafeInteger(result.generation)) {
        throw new Error("The server did not return a valid sharing-consent session.");
      }
      sharingEnabledRef.current = true;
      sharingGenerationRef.current = result.generation;
      setSharingEnabled(true);
      setLinkedFamilyCount(result.linkedFamilyCount);
      setMessage(result.linkedFamilyCount === 0
        ? "Sharing is enabled, but no currently linked family member is authorized to view it. New links will not gain access automatically."
        : `Sharing is enabled for ${result.linkedFamilyCount} currently linked family ${result.linkedFamilyCount === 1 ? "member" : "members"}.`);
      await startWatcher(false);
      await refreshFamilyLocations();
    } catch (enableError) {
      setError(errorText(enableError));
    } finally {
      setBusy(false);
    }
  };

  const disableSharing = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    sharingEnabledRef.current = false;
    stopWatcher();
    try {
      await Api.setLocationSharing({ enabled: false });
      sharingGenerationRef.current = null;
      setSharingEnabled(false);
      setLinkedFamilyCount(0);
      setCurrentPoint(null);
      setConsentChecked(false);
      setMessage("Location sharing is off. The server confirmed revocation and deleted your latest shared point.");
      await refreshFamilyLocations();
    } catch (disableError) {
      setError(`Tracking stopped on this device, but the server did not confirm revocation. A recent point may remain visible until it expires. Retry stopping while online. ${errorText(disableError)}`);
    } finally {
      setBusy(false);
    }
  };

  const resumeTracking = async () => {
    setBusy(true);
    setError("");
    try {
      sharingEnabledRef.current = true;
      const started = await startWatcher(true);
      if (started) setMessage("Foreground location updates are active while ElderCare stays open.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>Live location sharing</Text>
          <Text style={styles.description}>Foreground only. No background tracking or location history.</Text>
        </View>
        <StatusPill
          label={loading ? "CHECKING" : tracking ? "TRACKING" : sharingEnabled ? "PAUSED" : "OFF"}
          tone={tracking ? "good" : sharingEnabled ? "warm" : "neutral"}
        />
      </View>

      <Text style={styles.privacy}>When you opt in, your current location can be seen by only the active family links that exist at that moment. Later links are not added automatically. Points older than 5 minutes are hidden by the API. The latest point remains server-side until it is overwritten, revoked, or the project’s Firestore TTL cleanup removes it.</Text>

      {!sharingEnabled ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="I agree to share my latest live location with currently linked family members while ElderCare is in the foreground"
          accessibilityState={{ checked: consentChecked, disabled: loading || busy }}
          disabled={loading || busy}
          hitSlop={6}
          onPress={() => setConsentChecked((checked) => !checked)}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>{consentChecked ? <Text style={styles.checkmark}>✓</Text> : null}</View>
          <Text style={styles.consentText}>I agree to share my latest live location with the family members linked to my account now. New links will not receive it automatically. Updates stop outside the app’s foreground.</Text>
        </Pressable>
      ) : null}

      {loading ? <View style={styles.loading}><ActivityIndicator color={palette.primary} /><Text style={styles.muted}>Checking your secure sharing settings…</Text></View> : null}

      {sharingEnabled ? <Text style={styles.muted}>Your consent currently covers {linkedFamilyCount} active linked {linkedFamilyCount === 1 ? "member" : "members"}.</Text> : null}

      {currentPoint && tracking ? (
        <View style={styles.pointBox}>
          <Text style={styles.pointTitle}>{currentPoint.serverConfirmedAt ? "Last point confirmed by ElderCare" : "Device GPS fix (not yet confirmed as shared)"}</Text>
          <Text selectable style={styles.coordinates}>{formatCoordinates(currentPoint.latitude, currentPoint.longitude)}</Text>
          <Text style={styles.muted}>{currentPoint.serverConfirmedAt ? `Server receipt: ${formatTime(currentPoint.serverConfirmedAt)}` : `Device fix: ${formatTime(currentPoint.updatedAt)}`} · accuracy about {Math.round(currentPoint.accuracy)} m</Text>
        </View>
      ) : null}

      {locations.length > 0 ? (
        <View style={styles.familyBox}>
          <Text style={styles.pointTitle}>Sharing with you</Text>
          {locations.map((location, index) => (
            <View key={`${location.displayName}-${location.updatedAt}-${index}`} style={styles.familyRow}>
              <View style={styles.familyCopy}>
                <Text style={styles.familyName}>{location.displayName} · {location.role === "parent" ? "Parent" : "Family"}</Text>
                <Text selectable style={styles.coordinatesSmall}>{formatCoordinates(location.latitude, location.longitude)}</Text>
                <Text style={styles.muted}>Updated {formatTime(location.updatedAt)} · accuracy about {Math.round(location.accuracyMeters)} m</Text>
              </View>
              <StatusPill label="CURRENT" tone="good" />
            </View>
          ))}
        </View>
      ) : !loading ? <Text style={styles.muted}>No currently shared family location is available. A point appears only while its owner has opted in and updated within the last 5 minutes.</Text> : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {!sharingEnabled ? (
        <ActionButton disabled={loading || busy || !consentChecked} icon="location-on" onPress={enableSharing}>
          {busy ? "Please wait…" : "Share my live location"}
        </ActionButton>
      ) : (
        <View style={styles.actions}>
          {!tracking ? <ActionButton disabled={busy} icon="my-location" onPress={resumeTracking} variant="secondary">{busy ? "Please wait…" : "Resume while app is open"}</ActionButton> : null}
          <ActionButton disabled={busy} icon="location-disabled" onPress={disableSharing} variant="danger">{busy ? "Please wait…" : "Stop and delete my point"}</ActionButton>
        </View>
      )}

      <Text style={styles.footnote}>Stopping sharing asks the server to delete the latest point. If the network is unavailable, local updates stop but server deletion cannot be confirmed until you retry online. Firestore TTL cleanup must be enabled by the project owner.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 13 },
  headingRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  headingText: { flex: 1, gap: 4 },
  title: { color: palette.ink, fontSize: 17, fontWeight: "900" },
  description: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
  privacy: { color: palette.inkSoft, fontSize: 12, lineHeight: 19 },
  consentRow: { alignItems: "flex-start", flexDirection: "row", gap: 10, paddingVertical: 3 },
  checkbox: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.primary, borderRadius: 5, borderWidth: 1.5, height: 22, justifyContent: "center", marginTop: 1, width: 22 },
  checkboxChecked: { backgroundColor: palette.primary },
  checkmark: { color: palette.white, fontSize: 15, fontWeight: "900", lineHeight: 18 },
  consentText: { color: palette.ink, flex: 1, fontSize: 12, lineHeight: 18 },
  loading: { alignItems: "center", flexDirection: "row", gap: 9 },
  muted: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  pointBox: { backgroundColor: "#F1FAF9", borderColor: "#B8DFDB", borderRadius: 15, borderWidth: 1, gap: 4, padding: 12 },
  pointTitle: { color: palette.primaryDark, fontSize: 13, fontWeight: "800" },
  coordinates: { color: palette.ink, fontFamily: "monospace", fontSize: 16, fontWeight: "900" },
  coordinatesSmall: { color: palette.ink, fontFamily: "monospace", fontSize: 13, fontWeight: "800" },
  familyBox: { gap: 8 },
  familyRow: { alignItems: "center", backgroundColor: "#F8FCFE", borderColor: palette.line, borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, padding: 10 },
  familyCopy: { flex: 1, gap: 3 },
  familyName: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  error: { color: palette.terracotta, fontSize: 12, lineHeight: 18 },
  message: { color: palette.primaryDark, fontSize: 12, lineHeight: 18 },
  actions: { gap: 8 },
  footnote: { color: palette.muted, fontSize: 10, lineHeight: 16 },
});
