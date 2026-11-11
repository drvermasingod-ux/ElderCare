export type FirebaseIdentity = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

export type PhoneChallenge = {
  confirm(code: string): Promise<FirebaseIdentity>;
};
