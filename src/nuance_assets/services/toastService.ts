import _toast from 'react-hot-toast';
import { colors } from '../shared/constants';

export enum ToastType {
  Plain,
  Success,
  Error,
  Loading,
}

export const toastError = (err: any, preText: string = ''): void => {
  if (err.message) {
    toast(preText + err.message, ToastType.Error);
  } else {
    toast(preText + err, ToastType.Error);
  }
};

export const toast = (message: string, toastType: ToastType): void => {
  switch (toastType) {
    case ToastType.Success:
      _toast.success(message, {
        duration: 6000,
        iconTheme: {
          primary: colors.accentColor, // check mark color
          secondary: colors.primaryTextColor, //background color
        },
      });
      break;
    case ToastType.Error:
      _toast.error(message,
        {
          duration: 6000,
          iconTheme: {
            primary: colors.errorColor, // check mark color
            secondary: colors.primaryTextColor, //background color
          },
        });
      break;

    case ToastType.Loading:
      _toast.loading(message, {
        duration: 2000,
        iconTheme: {
          primary: colors.accentColor, // check mark color
          secondary: colors.primaryTextColor, //background color
        },
      });
      break;
    default:
      _toast(message);
      break;
  }
};






