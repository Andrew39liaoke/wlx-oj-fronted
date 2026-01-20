/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { QuestionQueryRequest } from '../models/QuestionQueryRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityPageQuestionVO } from '../models/ResponseEntityPageQuestionVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionThumbControllerService {

    /**
     * 点赞题目
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static save(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question/question/thumb/save',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 分页查询用户点赞的题目
     * @param requestBody 
     * @returns ResponseEntityPageQuestionVO OK
     * @throws ApiError
     */
    public static page(
requestBody: QuestionQueryRequest,
): CancelablePromise<ResponseEntityPageQuestionVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question/question/thumb/page',
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
            url: '/api/question/question/thumb/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
