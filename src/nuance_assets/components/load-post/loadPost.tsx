import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { usePostStore } from '../../store/index';

const LoadPost = () => {
    const { handle, id } = useParams();
    const location = useLocation();
    const { getPost, clearAll } = usePostStore((state) => ({
        getPost: state.getPost,
        clearAll: state.clearAll,
    }));

    useEffect(() => {
        console.log('LoadPost useEffect');
        if (handle && id) {
            const { postId, bucketCanisterId } = separateIds(id);
            getPost(handle, postId, bucketCanisterId);
            console.log('LoadPost useEffect getPost');
        }
    }, [handle, id, location.pathname]);

    const separateIds = (input: any) => {
        let parts = input.split('-');
        let postId = parts[0];
        let bucketCanisterId = parts.slice(1).join('-');
        return { postId, bucketCanisterId };
    };

    return null;
};

export default LoadPost;
