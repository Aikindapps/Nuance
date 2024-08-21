import React, { useState, useEffect, useContext } from 'react';
import Button from '../../UI/Button/Button';
import { useUserStore } from '../../store';
import { images } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext'


type SubscribeButtonProps = {
    AuthorHandle: string;
    user: string;
    isPublication: boolean;
    primaryColor?: string;
    isSubscribed: boolean;
};

const SubscribeButton: React.FC<SubscribeButtonProps> = (props): JSX.Element => {
    const [loading, setLoading] = useState(false);

    const context = useContext(Context)
    const modalContext = useContext(ModalContext)



    function handleSubscribe() {


        if (props.user === '') {

            handleRegister()

        } else {
            modalContext?.openModal('Subscription');

        }


    }
    function handleUnsubscribe() {
        if (props.AuthorHandle) {
            console.log('Unsubscribing to author:', props.AuthorHandle);
            modalContext?.openModal('cancelSubscription');

        }
        if (props.user === '') {
            handleRegister()
        }

    }

    function handleRegister() {
        modalContext?.openModal('Login')
    }


    return (
        <div className='followAuthor'>
            {props.isSubscribed ? (
                <Button
                    styleType={{dark: 'white', light: 'white'}}
                    type='button'
                    style={
                        props.isPublication ? { width: '180px', margin: '10px 0' }
                            : { width: '110px', margin: '10px 0' }
                    }
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    loading={loading}
                >
                    Unsubscribe
                </Button>
            ) : (
                <Button
                    styleType={{dark: 'white', light: 'white'}}
                    type='button'
                    style={
                        props.isPublication ? { width: '180px', margin: '10px 0' }
                            : { width: '96px', margin: '10px 0' }
                    }
                    onClick={handleSubscribe}
                    disabled={loading}
                    loading={loading}
                >
                    {props.isPublication ? 'Subscribe to this Publication' : 'Subscribe'}
                </Button>
            )}
        </div>
    );
};

export default SubscribeButton;
