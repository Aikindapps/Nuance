import React from 'react';
import { Link } from 'react-router-dom';
import './_warning-message.scss';

interface WarningMessageProps {
    message: string;
    link?: string;
    onClick?: () => void;
}

const WarningMessage: React.FC<WarningMessageProps> = ({ message, link, onClick }) => {
    return (
        <div className="warning-message">
            {message}
            {link && (
                <Link to={link} className="warning-link" onClick={onClick}>
                    wallet {" "}
                </Link>
            )}
            with NUA tokens.
        </div>
    );
};

export default WarningMessage;
