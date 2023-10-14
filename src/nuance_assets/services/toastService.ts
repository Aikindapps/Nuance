import _toast from 'react-hot-toast';

export enum ToastType {
  Plain,
  Success,
  Error,
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
      _toast.success(message, { duration: 6000 });
      break;
    case ToastType.Error:
      _toast.error(message);
      break;
    default:
      _toast(message);
      break;
  }
};
