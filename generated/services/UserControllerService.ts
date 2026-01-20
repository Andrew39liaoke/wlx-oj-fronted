/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityLoginUserVO } from '../models/ResponseEntityLoginUserVO';
import type { ResponseEntityLong } from '../models/ResponseEntityLong';
import type { ResponseEntityPageUser } from '../models/ResponseEntityPageUser';
import type { ResponseEntityPageUserVO } from '../models/ResponseEntityPageUserVO';
import type { ResponseEntityString } from '../models/ResponseEntityString';
import type { ResponseEntityUser } from '../models/ResponseEntityUser';
import type { ResponseEntityUserVO } from '../models/ResponseEntityUserVO';
import type { UserAddRequest } from '../models/UserAddRequest';
import type { UserLoginRequest } from '../models/UserLoginRequest';
import type { UserQueryRequest } from '../models/UserQueryRequest';
import type { UserRegisterRequest } from '../models/UserRegisterRequest';
import type { UserUpdateMyRequest } from '../models/UserUpdateMyRequest';
import type { UserUpdateRequest } from '../models/UserUpdateRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class UserControllerService {

    /**
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static updateUser(
requestBody: UserUpdateRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static updateMyUser(
requestBody: UserUpdateMyRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/update/my',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityLong OK
     * @throws ApiError
     */
    public static userRegister(
requestBody: UserRegisterRequest,
): CancelablePromise<ResponseEntityLong> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityLoginUserVO OK
     * @throws ApiError
     */
    public static login(
requestBody: UserLoginRequest,
): CancelablePromise<ResponseEntityLoginUserVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityPageUser OK
     * @throws ApiError
     */
    public static listUserByPage(
requestBody: UserQueryRequest,
): CancelablePromise<ResponseEntityPageUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/list/page',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityPageUserVO OK
     * @throws ApiError
     */
    public static listUserVoByPage(
requestBody: UserQueryRequest,
): CancelablePromise<ResponseEntityPageUserVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/list/page/vo',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityBoolean OK
     * @throws ApiError
     */
    public static deleteUser(
requestBody: DeleteRequest,
): CancelablePromise<ResponseEntityBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody 
     * @returns ResponseEntityLong OK
     * @throws ApiError
     */
    public static addUser(
requestBody: UserAddRequest,
): CancelablePromise<ResponseEntityLong> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @returns ResponseEntityString OK
     * @throws ApiError
     */
    public static logout(): CancelablePromise<ResponseEntityString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/user/logout',
        });
    }

    /**
     * @param id 
     * @returns ResponseEntityUser OK
     * @throws ApiError
     */
    public static getUserById(
id: number,
): CancelablePromise<ResponseEntityUser> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/user/get',
            query: {
                'id': id,
            },
        });
    }

    /**
     * @param id 
     * @returns ResponseEntityUserVO OK
     * @throws ApiError
     */
    public static getUserVoById(
id: number,
): CancelablePromise<ResponseEntityUserVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/user/get/vo',
            query: {
                'id': id,
            },
        });
    }

    /**
     * @returns ResponseEntityLoginUserVO OK
     * @throws ApiError
     */
    public static getLoginUser(): CancelablePromise<ResponseEntityLoginUserVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/user/get/login',
        });
    }

}
