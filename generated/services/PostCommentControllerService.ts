/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { PostCommentRequest } from '../models/PostCommentRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityListPostCommentVO } from '../models/ResponseEntityListPostCommentVO';
import type { ResponseEntityLong } from '../models/ResponseEntityLong';
import type { ResponseEntityPostCommentVO } from '../models/ResponseEntityPostCommentVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PostCommentControllerService {

    /**
     * 更新评论
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static update1(
requestBody: PostCommentRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/post/comment/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 保存评论
     * @param requestBody 
     * @returns ResponseEntityLong OK
     * @throws ApiError
     */
    public static save3(
requestBody: PostCommentRequest,
): CancelablePromise<ResponseEntityLong> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/comment/save',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 获取帖子的评论列表
     * @param postId 
     * @returns ResponseEntityListPostCommentVO OK
     * @throws ApiError
     */
    public static getPostComments(
postId: number,
): CancelablePromise<ResponseEntityListPostCommentVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/post/comment/post/{postId}',
            path: {
                'postId': postId,
            },
        });
    }

    /**
     * 获取评论
     * @param id 
     * @returns ResponseEntityPostCommentVO OK
     * @throws ApiError
     */
    public static getInfo1(
id: number,
): CancelablePromise<ResponseEntityPostCommentVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/post/comment/get/{id}',
            path: {
                'id': id,
            },
        });
    }

    /**
     * 删除评论
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static remove3(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/post/comment/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
