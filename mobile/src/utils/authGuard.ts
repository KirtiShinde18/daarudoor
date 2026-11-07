import { store } from '../store';

export const requireAuth = (
  navigation: any,
  actionOrTarget: (() => void) | string,
  params?: any
) => {
  const state = store.getState();
  const token = state.auth.token;

  if (token) {
    if (typeof actionOrTarget === 'function') {
      actionOrTarget();
    } else {
      navigation.navigate(actionOrTarget, params);
    }
  } else {
    let targetPath = '';
    if (typeof actionOrTarget === 'string') {
      targetPath = actionOrTarget;
    } else if (params?.targetPath) {
      targetPath = params.targetPath;
    }
    
    navigation.navigate('Login', { targetPath });
  }
};
