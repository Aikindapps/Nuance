import {
  Comment,
  PostBucketType,
} from '../../../../src/declarations/PostBucket/PostBucket.did';
import { PostKeyProperties } from '../../../../src/declarations/PostCore/PostCore.did';

export interface CommentType extends Comment {
  post: PostKeyProperties;
}

export type MetricsValue = {
  name: string;
  value: number;
};

export type CanisterCyclesValue = {
  cai: string;
  cycles: number;
};

export type ProposalSummaryValue = {
  description: string;
  number: number;
  isRed: boolean;
};

export type PostType = {
  postId: string;
  handle: string;
  title: string;
  url: string;
  subtitle: string;
  headerImage: string;
  content: string;
  isDraft: boolean;
  created: string;
  modified: string;
  publishedDate: string;
  views: string;
  //wordCount: BigInt
  tags: Array<{ tagId: string; tagName: string }>;
  claps: string;
  category: string;
  isPremium: boolean;
  bucketCanisterId: string;
  wordCount: string;

  // populated for post lists after calling
  // getUsersByHandles in User canister
  avatar?: string;
  creator?: string;
  isPublication?: boolean;
  displayName?: string;
  fontType?: string;
};
