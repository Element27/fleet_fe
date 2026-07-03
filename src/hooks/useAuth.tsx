import { createContext, useContext, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import { setTokenProvider } from '../lib/api';

interface AuthCtx {
  user: {
    id: string;
    fullname: string;
    email: string;
    role: string;
    organisation: string;
  } | null;
  isLoaded: boolean;
  signIn: ReturnType<typeof useSignIn>;
  signUp: ReturnType<typeof useSignUp>;
  signOut: (() => void) | null;
  isSignedIn: boolean;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  isLoaded: false,
  signIn: null as any,
  signUp: null as any,
  signOut: null,
  isSignedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { getToken, signOut, isSignedIn } = useClerkAuth();
  const signIn = useSignIn();
  const signUp = useSignUp();

  useEffect(() => {
    setTokenProvider(() => getToken({ template: undefined }).then(t => t ?? null));
  }, [getToken]);

  const user = clerkUser && isSignedIn
    ? {
        id: clerkUser.id,
        fullname: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: (clerkUser.publicMetadata?.role as string) || 'user',
        organisation: (clerkUser.publicMetadata?.organisation as string) || '',
      }
    : null;

  return (
    <Ctx.Provider value={{ user, isLoaded: userLoaded, signIn, signUp, signOut, isSignedIn: !!isSignedIn }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
