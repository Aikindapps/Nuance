import { PostType, PublicationType } from '../../types/types';

export interface CardEditorPublicationProps {
  post: PostType;
  toggleHandler: Function;
  isLoading: boolean;
  categories: string[];
  categoryChangeHandler: Function;
  publication: PublicationType | undefined;
  refreshPosts: (postId: string) => Promise<void>
}
