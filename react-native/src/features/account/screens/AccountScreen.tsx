import { restoreSourceCopy, screenSourceKeys, useI18n } from '../../../i18n';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser } from '../../../services/auth/types';
import { useAccountProfile } from '../hooks/useAccountProfile';
import { accountCopy as copy, type AccountCopy } from '../model/accountCopy';
import { Image, Linking, Platform, Pressable, View } from 'react-native';
import { getBackend } from '../../../config/runtime';
import { useAppStore } from '../../../state/store';
import {
  Button,
  Card,
  Field,
  Icon,
  Notice,
  Row,
  Section,
  Sheet,
  T,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import {
  getAuthLinkState,
  subscribeAuthLinkState,
  updateAuthLinkState,
} from '../model/authLinkState';
import { KeyboardFormScreen } from '../components/KeyboardFormScreen';
import { AppleSignInButton } from '../components/AppleSignInButton';

type Action = 'password' | 'email' | 'reset' | 'delete' | 'recovery';

function validEmail(value: string) {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validPassword(value: string) {
  return value.length >= 12 && value.length <= 128 && value.trim().length > 0;
}
function authErrorText(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const details = error as { code?: unknown; message?: unknown };
  return [details.code, details.message]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}
function emailConfirmationRequired(error: unknown) {
  const message = authErrorText(error);
  return message.includes('email_not_confirmed') || message.includes('email not confirmed');
}
function errorCopy(error: unknown, t: AccountCopy) {
  const message = authErrorText(error);
  if (message.includes('apple_delete_requires_ios')) return t.appleDeleteRequiresIos;
  if (message.includes('apple_')) return t.appleDeleteFailed;
  if (emailConfirmationRequired(error)) return t.emailUnconfirmed;
  if (message.includes('invalid_credentials') || message.includes('invalid login'))
    return t.wrongPassword;
  if (message.includes('recent_login_required')) return t.recentLogin;
  if (message.includes('owns_groups')) return t.deletionBlocked;
  if (message.includes('linked_data') || message.includes('foreign key'))
    return t.deletionLinkedData;
  if (message.includes('pgrst202') || message.includes('42883')) return t.deletionNotReady;
  if (
    message.includes('429') ||
    message.includes('rate_limit') ||
    message.includes('over_email_send')
  )
    return t.rateLimit;
  return t.genericError;
}

export function AccountScreen() {
  const backend = useMemo(() => getBackend(), []);
  const { state } = useAppStore();
  const p = usePalette();
  const { t: sourceText } = useI18n();
  const t = restoreSourceCopy(
    state.preferences.language,
    copy[state.preferences.language],
    copy.en,
    screenSourceKeys.account,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const authPending = useRef(false);
  const mounted = useRef(true);
  const currentAccountId = useRef<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [manualAppleRevocation, setManualAppleRevocation] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [action, setAction] = useState<Action | null>(null);
  const [deletionStatus, setDeletionStatus] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [signupConfirmation, setSignupConfirmation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [nonce, setNonce] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [codeInfo, setCodeInfo] = useState('');
  const [authLinkState, setAuthLinkState] = useState(getAuthLinkState);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => subscribeAuthLinkState(setAuthLinkState), []);
  useEffect(() => {
    if (authLinkState.error) setError(authLinkState.error);
    if (authLinkState.recoveryActive) {
      clearForm();
      setNotice('');
      setAction('recovery');
    }
  }, [authLinkState]);

  useEffect(() => {
    const auth = backend?.auth;
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    let mounted = true;
    let authRevision = 0;
    const unsubscribe = auth.onChange((session) => {
      if (mounted) {
        ++authRevision;
        if (currentAccountId.current !== (session?.user.id ?? null)) {
          clearForm();
          setAction(null);
          setPassword('');
          setSignupConfirmation('');
          setNotice('');
          setManualAppleRevocation(false);
        }
        currentAccountId.current = session?.user.id ?? null;
        setUser(session?.user ?? null);
        if (session) setConfirmationEmail(null);
      }
    });
    const initialRevision = authRevision;
    auth
      .getSession()
      .then((session) => {
        if (mounted && authRevision === initialRevision) {
          currentAccountId.current = session?.user.id ?? null;
          setUser(session?.user ?? null);
        }
      })
      .catch(() => {
        if (mounted && authRevision === initialRevision) setError(t.genericError);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [backend, t.genericError]);

  const { profileName, setProfileName, avatarUrl, profileBusy, saveProfile, chooseAvatar } =
    useAccountProfile({
      profiles: backend?.profiles,
      account: user,
      messages: t,
      errorMessage: (error) => errorCopy(error, t),
      setError,
      setNotice,
    });

  const provider = user?.provider ?? 'email';
  const isEmailAccount = provider === 'email';
  const providerLabel =
    provider === 'apple'
      ? t.appleProvider
      : provider === 'google'
        ? t.googleProvider
        : t.emailProvider;
  const accountEmail = user?.email ?? '';
  const actionTitles: Record<Action, string> = {
    password: t.changePassword,
    email: t.changeEmail,
    reset: t.reset,
    delete: t.deleteAccount,
    recovery: t.recovery,
  };
  function clearForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setNewEmail('');
    setNonce('');
    setNeedsCode(false);
    setCodeInfo('');
    setError('');
  }
  async function openAction(next: Action) {
    setError('');
    setNotice('');
    clearForm();
    setAction(next);
    if (next === 'delete') {
      setDeletionStatus('checking');
      try {
        setDeletionStatus(await backend!.auth.accountDeletionStatus());
      } catch (e) {
        setDeletionStatus('unavailable');
        setError(errorCopy(e, t));
      }
    }
  }
  const passwordValid = validPassword(newPassword) && newPassword === confirmation;
  const canSubmitAction =
    !busy &&
    (action === 'reset'
      ? validEmail(email || accountEmail)
      : action === 'recovery'
        ? passwordValid
        : action === 'password'
          ? Boolean(currentPassword) && passwordValid
          : action === 'email'
            ? Boolean(currentPassword) &&
              validEmail(newEmail) &&
              newEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()
            : action === 'delete'
              ? deletionStatus === 'ready' &&
                confirmation.trim().toLowerCase() === accountEmail.trim().toLowerCase() &&
                (!isEmailAccount || Boolean(currentPassword))
              : false);

  async function signInWithGoogle() {
    if (!backend || busy || authPending.current) return;
    authPending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const url = await backend.auth.signInWithGoogle();
      await Linking.openURL(url);
      setNotice(sourceText('account.googleLoginOpened'));
    } catch {
      setError(sourceText('account.googleLoginFailed'));
    } finally {
      authPending.current = false;
      setBusy(false);
    }
  }
  async function signInWithApple() {
    if (!backend || busy || authPending.current) return;
    authPending.current = true;
    setBusy(true);
    setAppleBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await backend.auth.signInWithApple();
      if (!result || !mounted.current) return;
      const session = await backend.auth.getSession();
      if (
        !mounted.current ||
        session?.user.id !== result.user.id ||
        currentAccountId.current !== result.user.id
      )
        return;
      currentAccountId.current = result.user.id;
      setUser(session.user);
      setConfirmationEmail(null);
      setPassword('');
      setSignupConfirmation('');
      if (result.firstSignInName && backend.profiles) {
        // This optional first-authorization name never replaces a custom profile.
        await backend.profiles.rememberProviderName(result.user.id, result.firstSignInName);
        const profile = await backend.profiles.load(session.user);
        if (mounted.current && currentAccountId.current === result.user.id)
          setProfileName(profile.displayName);
      }
    } catch {
      if (mounted.current && !currentAccountId.current) setError(t.appleLoginFailed);
    } finally {
      authPending.current = false;
      if (mounted.current) {
        setAppleBusy(false);
        setBusy(false);
      }
    }
  }
  async function submitAuth() {
    if (!backend || busy || authPending.current) return;
    if (!validEmail(email)) {
      setError(t.emailInvalid);
      return;
    }
    if (authMode === 'signUp' && password !== signupConfirmation) {
      setError(t.passwordMismatch);
      return;
    }
    authPending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setConfirmationEmail(null);
    try {
      if (!validEmail(email)) throw new Error('invalid_email');
      if (authMode === 'signIn') await backend.auth.signIn(email.trim(), password);
      else {
        if (!password) throw new Error('password_required');
        await backend.auth.signUp(email.trim(), password, displayName.trim() || undefined);
        // An unconfirmed signup can return a User without a signed-in session.
        if (!(await backend.auth.getSession())) {
          setConfirmationEmail(email.trim());
          setNotice(t.emailUnconfirmed);
        }
      }
      setPassword('');
      setSignupConfirmation('');
    } catch (e) {
      if (emailConfirmationRequired(e)) setConfirmationEmail(email.trim());
      setError(errorCopy(e, t));
    } finally {
      authPending.current = false;
      setBusy(false);
    }
  }

  function changeAuthEmail(value: string) {
    setEmail(value);
    setConfirmationEmail(null);
    setNotice('');
    setError('');
  }

  async function resendConfirmation() {
    if (!backend || busy || !confirmationEmail) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await backend.auth.resendSignUpConfirmation(confirmationEmail);
      setNotice(t.confirmationSent);
    } catch (e) {
      setError(errorCopy(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function performAction() {
    if (!backend || !action || busy || authPending.current) return;
    authPending.current = true;
    const requestedBy = currentAccountId.current;
    setBusy(true);
    setError('');
    try {
      if (action === 'reset') {
        await backend.auth.requestPasswordReset(
          (email || accountEmail).trim(),
          'qurantracker://auth',
        );
        if (currentAccountId.current !== requestedBy) return;
        setNotice(t.resetSent);
      } else if (action === 'recovery') {
        await backend.auth.completePasswordRecovery(newPassword);
        if (currentAccountId.current !== requestedBy) return;
        updateAuthLinkState({ recoveryActive: false, error: null });
        setNotice(t.passwordChanged);
      } else if (action === 'password') {
        await backend.auth.updateUserPassword(newPassword, currentPassword, nonce);
        if (currentAccountId.current !== requestedBy) return;
        setNotice(t.passwordChanged);
      } else if (action === 'email') {
        await backend.auth.updateUserEmail(newEmail.trim(), currentPassword, 'qurantracker://auth');
        if (currentAccountId.current !== requestedBy) return;
        setNotice(t.emailSent);
      } else {
        const deletion = await backend.auth.deleteOwnAccount(
          confirmation,
          isEmailAccount ? currentPassword : undefined,
        );
        const current = await backend.auth.getSession();
        if (current && current.user.id !== user?.id) return;
        setUser(null);
        setManualAppleRevocation(Boolean(deletion?.manualAppleRevocation));
        setNotice(deletion?.manualAppleRevocation ? t.appleManualRevocation : t.deleted);
      }
      setAction(null);
    } catch (e) {
      if (currentAccountId.current !== requestedBy) return;
      const message = e instanceof Error ? e.message.toLowerCase() : '';
      if (message === 'apple_request_canceled') return;
      if (message.includes('reauthentication') || message.includes('nonce')) setNeedsCode(true);
      setError(errorCopy(e, t));
    } finally {
      authPending.current = false;
      setBusy(false);
    }
  }

  async function requestChangeCode() {
    if (!backend) return;
    setBusy(true);
    setError('');
    try {
      await backend.auth.requestPasswordChangeCode();
      setCodeInfo(t.codeSent);
    } catch (e) {
      setError(errorCopy(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!backend) return;
    setBusy(true);
    setError('');
    try {
      await backend.auth.signOut();
      setUser(null);
    } catch (e) {
      setError(errorCopy(e, t));
    } finally {
      setBusy(false);
    }
  }

  const name = profileName || user?.displayName || accountEmail.split('@')[0] || '';
  return (
    <KeyboardFormScreen>
      <T size={32} bold style={{ letterSpacing: -0.6 }}>
        {t.title}
      </T>
      <T muted style={{ marginTop: 6 }}>
        {t.subtitle}
      </T>
      {error ? <Notice message={error} error /> : null}
      {notice ? <Notice message={notice} /> : null}
      {manualAppleRevocation ? (
        <Button
          title={t.appleRevocationInstructions}
          variant="secondary"
          onPress={() =>
            void Linking.openURL('https://support.apple.com/102571').catch(() =>
              setError(t.genericError),
            )
          }
        />
      ) : null}
      {!backend ? <Notice message={t.noBackend} /> : null}

      {authLoading ? (
        <Card style={{ marginTop: 24, borderWidth: 1, borderColor: p.line }}>
          <T muted>{t.busy}</T>
        </Card>
      ) : user ? (
        <>
          <Section title={t.account} />
          <Card style={{ borderWidth: 1, borderColor: p.line, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: p.lime,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    accessibilityLabel={t.avatar}
                    style={{ width: 54, height: 54, borderRadius: 27 }}
                  />
                ) : (
                  <T size={22} bold color={p.onLime}>
                    {name.slice(0, 1).toUpperCase() || 'W'}
                  </T>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T bold size={18}>
                  {name || t.signedIn}
                </T>
                <T size={14} muted textDirection="ltr">
                  {accountEmail}
                </T>
              </View>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: p.line,
                paddingTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Icon
                name={
                  provider === 'google' ? 'chrome' : provider === 'apple' ? 'user-check' : 'mail'
                }
                size={18}
                color={p.primary}
              />
              <T size={14} color={p.muted}>
                {providerLabel}
              </T>
            </View>
          </Card>
          <Section title={t.profile} />
          <Card style={{ borderWidth: 1, borderColor: p.line, gap: 12 }}>
            <Field
              label={t.profileName}
              value={profileName}
              onChangeText={setProfileName}
              maxLength={40}
              autoCapitalize="words"
              editable={!busy}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                title={t.saveProfile}
                icon="check"
                onPress={() => void saveProfile()}
                loading={profileBusy}
                disabled={busy || profileBusy || !profileName.trim()}
                style={{ flex: 1 }}
              />
              <Button
                title={t.avatar}
                icon="image"
                onPress={() => void chooseAvatar()}
                loading={profileBusy}
                disabled={busy || profileBusy}
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
          <Section title={t.manage} />
          {isEmailAccount ? (
            <>
              <Row
                icon="key"
                title={t.changePassword}
                onPress={() => void openAction('password')}
              />
              <Row icon="at-sign" title={t.changeEmail} onPress={() => void openAction('email')} />
            </>
          ) : (
            <Card style={{ borderWidth: 1, borderColor: p.line, gap: 8, marginBottom: 8 }}>
              <T bold>{providerLabel}</T>
              <T size={14} muted>
                {t.subtitle}
              </T>
            </Card>
          )}
          <Row
            icon="trash-2"
            title={t.deleteAccount}
            danger
            onPress={() => void openAction('delete')}
          />
          <Button
            title={t.signOut}
            onPress={() => void signOut()}
            disabled={busy}
            variant="secondary"
            icon="log-out"
            style={{ marginTop: 22 }}
          />
        </>
      ) : (
        <>
          <Section title={t.signedOut} />
          <Card style={{ borderWidth: 1, borderColor: p.line, gap: 6, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Icon name="shield" size={18} color={p.primary} />
              <T bold>{authMode === 'signIn' ? t.signIn : t.create}</T>
            </View>
            <Field
              label={t.email}
              value={email}
              onChangeText={changeAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {authMode === 'signUp' ? (
              <Field
                label={t.name}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            ) : null}
            <Field
              label={t.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!visiblePasswords}
              autoCapitalize="none"
              textContentType={authMode === 'signIn' ? 'password' : 'newPassword'}
            />
            {authMode === 'signUp' ? (
              <Field
                label={t.repeatSignupPassword}
                value={signupConfirmation}
                onChangeText={setSignupConfirmation}
                secureTextEntry={!visiblePasswords}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                error={
                  signupConfirmation && password !== signupConfirmation
                    ? t.passwordMismatch
                    : undefined
                }
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.passwordVisibility}
              onPress={() => setVisiblePasswords((v) => !v)}
              style={{
                minHeight: 48,
                justifyContent: 'center',
                alignSelf: 'flex-end',
                marginTop: -12,
                paddingHorizontal: 8,
              }}
            >
              <T size={13} color={p.primary}>
                {t.passwordVisibility}
              </T>
            </Pressable>
            <Button
              title={authMode === 'signIn' ? t.signIn : t.create}
              onPress={() => void submitAuth()}
              loading={busy}
              disabled={
                busy ||
                !email ||
                !password ||
                !backend ||
                (authMode === 'signUp' && (!signupConfirmation || password !== signupConfirmation))
              }
            />
            {confirmationEmail ? (
              <Button
                title={t.resendConfirmation}
                icon="mail"
                variant="secondary"
                onPress={() => void resendConfirmation()}
                disabled={busy}
                loading={busy}
                style={{ marginTop: 8 }}
              />
            ) : null}
            <Row
              title={authMode === 'signIn' ? t.signUp : t.signIn}
              icon={authMode === 'signIn' ? 'user-plus' : 'log-in'}
              onPress={() => {
                setAuthMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
                setSignupConfirmation('');
                setError('');
                setNotice('');
                setConfirmationEmail(null);
              }}
            />
            {authMode === 'signIn' ? (
              <Row
                title={t.forgot}
                icon="mail"
                onPress={() => {
                  setAction('reset');
                  setError('');
                  setNotice('');
                }}
              />
            ) : null}
          </Card>
          <Button
            title={sourceText('account.signInWithGoogle')}
            icon="chrome"
            variant="secondary"
            onPress={() => void signInWithGoogle()}
            loading={busy}
            disabled={busy || !backend}
            style={{ marginTop: 14 }}
          />
          <AppleSignInButton
            onPress={() => void signInWithApple()}
            loading={appleBusy}
            disabled={busy || !backend}
          />
        </>
      )}

      <Sheet
        avoidKeyboard
        visible={action !== null}
        title={action ? actionTitles[action] : t.manage}
        onClose={() => {
          if (!busy) {
            setAction(null);
            clearForm();
          }
        }}
      >
        {action === 'delete' && user?.appleLinked ? (
          <Notice message={Platform.OS === 'ios' ? t.appleDeleteHelp : t.appleDeleteRequiresIos} />
        ) : null}
        <T muted style={{ marginBottom: 16 }}>
          {action === 'reset'
            ? t.resetHelp
            : action === 'email'
              ? t.emailHelp
              : action === 'delete'
                ? t.deletionHelp
                : action === 'recovery'
                  ? t.recoveryHelp
                  : t.passwordHelp}
        </T>
        {action === 'reset' ? (
          <Field
            label={t.email}
            value={email || accountEmail}
            onChangeText={changeAuthEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : null}
        {action === 'delete' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <Icon name="alert-triangle" color={p.danger} size={18} />
              <T size={14} color={p.danger}>
                {deletionStatus === 'checking'
                  ? t.deletionChecking
                  : deletionStatus === 'ready'
                    ? t.deletionHelp
                    : deletionStatus === 'owns_groups'
                      ? t.deletionBlocked
                      : deletionStatus === 'linked_data'
                        ? t.deletionLinkedData
                        : deletionStatus === 'unavailable'
                          ? error || t.deletionNotReady
                          : t.deletionNotReady}
              </T>
            </View>
            <Field
              label={t.confirmation}
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </>
        ) : null}
        {action === 'password' || action === 'email' || (action === 'delete' && isEmailAccount) ? (
          <Field
            label={t.currentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!visiblePasswords}
            autoCapitalize="none"
          />
        ) : null}
        {action === 'email' ? (
          <Field
            label={t.newEmail}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        ) : null}
        {action === 'password' || action === 'recovery' ? (
          <>
            <Field
              label={t.newPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!visiblePasswords}
              autoCapitalize="none"
            />
            <T size={13} muted style={{ marginTop: -8, marginBottom: 12 }}>
              {t.passwordHelp}
            </T>
            <Field
              label={t.repeatPassword}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry={!visiblePasswords}
              autoCapitalize="none"
              error={confirmation && confirmation !== newPassword ? t.passwordMismatch : undefined}
            />
            {action === 'password' && needsCode ? (
              <>
                <T muted style={{ marginBottom: 10 }}>
                  {t.codeHelp}
                </T>
                <Field
                  label={t.enterCode}
                  value={nonce}
                  onChangeText={setNonce}
                  autoCapitalize="none"
                />
                {codeInfo ? (
                  <T size={14} color={p.primary}>
                    {codeInfo}
                  </T>
                ) : null}
                <Button
                  title={t.sendCode}
                  onPress={() => void requestChangeCode()}
                  disabled={busy}
                  variant="secondary"
                  icon="mail"
                />
              </>
            ) : null}
          </>
        ) : null}
        {error ? <Notice message={error} error /> : null}
        {notice ? <Notice message={notice} /> : null}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Button
            title={t.cancel}
            variant="secondary"
            onPress={() => {
              setAction(null);
              clearForm();
            }}
            disabled={busy}
            style={{ flex: 1 }}
          />
          <Button
            title={action === 'reset' ? t.reset : action === 'delete' ? t.deleteAccount : t.save}
            variant={action === 'delete' ? 'danger' : 'primary'}
            onPress={() => void performAction()}
            disabled={!canSubmitAction}
            loading={busy}
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>
    </KeyboardFormScreen>
  );
}
