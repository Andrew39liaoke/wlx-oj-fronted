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

export class PostFavourControllerService {

    /**
     * 收藏帖子
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static save2(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/favour/save',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 分页查询用户收藏的帖子
     * @param requestBody 
     * @returns ResponseEntityPagePostVO OK
     * @throws ApiError
     */
    public static page2(
requestBody: PostQueryRequest,
): CancelablePromise<ResponseEntityPagePostVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/favour/page',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 取消收藏
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static remove2(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/post/favour/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
