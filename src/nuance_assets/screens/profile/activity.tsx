import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoIosArrowDown } from 'react-icons/io';
import { colors } from '../../shared/constants';
import './_profile.scss';

type ActivityLinkProps = {
    followedTopicsCount: number;
    followingCount: number;
    followersCount: number;
    dark?: boolean;
    subscriptionCount: number;
};

const Activity: React.FC<ActivityLinkProps> = ({
    followedTopicsCount,
    followingCount,
    followersCount,
    dark,
    subscriptionCount,
}) => {
    const [isActivityExpanded, setIsActivityExpanded] = useState(false);
    const location = useLocation();

    const activityRoutes = [
        {
            title: `Subscriptions (${subscriptionCount})`,
            goto: '/my-profile/subscriptions',
        },
        {
            title: `Followed Topics (${followedTopicsCount})`,
            goto: '/my-profile/topics',
        },
        {
            title: `Following (${followingCount})`,
            goto: '/my-profile/following',
        },
        {
            title: `Followers (${followersCount})`,
            goto: '/my-profile/followers',
        },
    ];

    useEffect(() => {
        // Check if the current location matches any activity routes
        const isCurrentLocationAnActivity = activityRoutes.some(route => location.pathname.includes(route.goto));
        if (isCurrentLocationAnActivity) {
            setIsActivityExpanded(true);
        }
    }, [location.pathname]);

    const toggleActivity = () => {
        setIsActivityExpanded(!isActivityExpanded);
    };

    const darkOptionsAndColors = {
        background: dark ? colors.darkModePrimaryBackgroundColor : colors.primaryBackgroundColor,
        color: dark ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
    };

    return (
        <div className='activity-links'>
            <div onClick={toggleActivity}>
                <div className='route'>
                    <span className='activity-dropdown' style={{ flexGrow: 1, color: darkOptionsAndColors.color }}>
                        Activity
                    </span>
                    <IoIosArrowDown
                        className={`arrow-button ${isActivityExpanded ? 'expanded' : ''}`}
                        style={{ color: darkOptionsAndColors.color }}
                    />
                </div>
            </div>
            {isActivityExpanded && (
                <div className='sub-route activities'>
                    {activityRoutes.map((route) => (
                        <Link
                            className={`route ${location.pathname === route.goto ? 'sub-route-active' : ''}`}
                            key={route.goto}
                            to={route.goto}
                            style={{
                                color: location.pathname === route.goto ? colors.accentColor : darkOptionsAndColors.color,
                            }}
                        >
                            {route.title}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Activity;
