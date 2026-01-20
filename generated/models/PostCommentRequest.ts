/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 评论
 */
export type PostCommentRequest = {
    id?: number;
    parentId?: number;
    postId: number;
    content: string;
    authorId?: number;
    createTime?: string;
};
