import { Comment, PostBucketType } from "../../../../src/declarations/PostBucket/PostBucket.did";
import { PostKeyProperties } from "../../../../src/declarations/PostCore/PostCore.did";

export interface CommentType extends Comment {
    post: PostKeyProperties; 
 }