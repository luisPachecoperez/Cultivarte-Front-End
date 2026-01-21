export interface GoogleAccountsId {
  revoke: (email: string, done: () => void) => void;
  cancel?: () => void;
}

export interface GoogleAccounts {
  accounts: {
    id: GoogleAccountsId;
  };
}
