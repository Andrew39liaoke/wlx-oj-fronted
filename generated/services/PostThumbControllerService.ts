/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { PostQueryRequest } from '../models/PostQueryRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityPagePostVO } from '../models/ResponseEntityPagePostVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PostThumbControllerService {

    /**
     * 点赞帖子
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static save(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/thumb/save',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 分页查询用户点赞的帖子
     * @param requestBody 
     * @returns ResponseEntityPagePostVO OK
     * @throws ApiError
     */
    public static page(
requestBody: PostQueryRequest,
): CancelablePromise<ResponseEntityPagePostVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/thumb/page',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 取消点赞
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static remove(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/post/thumb/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
