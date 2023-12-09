import { PostType } from '../../types/types';

export interface CardEditorPublicationProps {
  post: PostType;
  toggleHandler: Function;
  isLoading: boolean;
  categories: any;
  categoryChangeHandler: Function;
}
