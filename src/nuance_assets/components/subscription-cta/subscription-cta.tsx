import React from 'react';
import { icons, colors } from '../../shared/constants'
import './_subscription-cta.scss';  // Ensure your CSS file is correctly referenced
import Button from '../../UI/Button/Button';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/ModalContext';

interface SubscriptionCtaProps {
    onOpen: () => void;
}

const SubscriptionCta: React.FC<SubscriptionCtaProps> = ({ onOpen }) => {
    const darkTheme = useTheme();
    const modalContext = React.useContext(Context);

    const handleOpen = () => {
        modalContext?.openModal('Subscription');
        onOpen();
    }

    return (
        <div className="subscription-card-wrapper">
            <div className={darkTheme ? "subscription-card dark" : "subscription-card"}>
                <div className="badge">NEW!</div>
                <img src={icons.SUBSCRIPTION_STAR_ICON} alt="Star Icon" className="star-icon-cta" />
                <p>Subscribe to this publication and get unlimited access to all <a href='/' >membership content</a> for a periodical fee!</p>
                <Button
                    styleType='primary-1'
                    type='button'
                    style={
                        darkTheme
                            ? { background: colors.accentColor, width: '100%' }
                            : { width: '100%' }
                    }
                    onClick={() => handleOpen()}
                >
                    Subscribe now!
                </Button>
            </div>
        </div >
    );
};

export default SubscriptionCta;
