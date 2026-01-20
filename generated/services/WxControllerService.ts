/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseEntityMapStringString } from '../models/ResponseEntityMapStringString';
import type { ResponseEntityObject } from '../models/ResponseEntityObject';
import type { ResponseEntityString } from '../models/ResponseEntityString';
import type { WeChatRequest } from '../models/WeChatRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class WxControllerService {

    /**
     * @param weChatRequestDto 
     * @returns string OK
     * @throws ApiError
     */
    public static checkWebChat(
weChatRequestDto: WeChatRequest,
): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/wechat',
            query: {
                'weChatRequestDTO': weChatRequestDto,
            },
        });
    }

    /**
     * @returns ResponseEntityMapStringString OK
     * @throws ApiError
     */
    public static getQrCode(): CancelablePromise<ResponseEntityMapStringString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/wechat/qrCode',
        });
    }

    /**
     * @param code 
     * @param state 
     * @returns ResponseEntityString OK
     * @throws ApiError
     */
    public static login1(
code: string,
state: string,
): CancelablePromise<ResponseEntityString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/wechat/login',
            query: {
                'code': code,
                'state': state,
            },
        });
    }

    /**
     * @param state 
     * @returns ResponseEntityObject OK
     * @throws ApiError
     */
    public static checkLogin(
state: string,
): CancelablePromise<ResponseEntityObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/wechat/check',
            query: {
                'state': state,
            },
        });
    }

}
