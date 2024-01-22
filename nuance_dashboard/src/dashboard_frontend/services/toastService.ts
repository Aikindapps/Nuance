import _toast from 'react-hot-toast';
import { colors } from '../../../../src/nuance_assets/shared/constants';

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

export const toastSuccess = (text: string = ''): void => {
    toast(text, ToastType.Success);
};

export const toast = (message: string, toastType: ToastType): void => {
    switch (toastType) {
        case ToastType.Success:
            _toast.success(message, {
                duration: 6000,
                iconTheme: {
                    primary: colors.accentColor, 
                    secondary: colors.primaryTextColor, 
                  },
            });
            break;
        case ToastType.Error:
            _toast.error(message,
                {
                    duration: 6000,
                    iconTheme: {
                        primary: colors.errorColor, 
                        secondary: colors.primaryTextColor, 
                      },
                });
            break;
        default:
            _toast(message);
            break;
    }
};






