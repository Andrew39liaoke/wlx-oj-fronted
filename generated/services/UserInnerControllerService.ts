/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { User } from '../models/User';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class UserInnerControllerService {

    /**
     * @param username 
     * @returns string OK
     * @throws ApiError
     */
    public static getRoleNamesByUsername(
username: string,
): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/inner/getRoleNamesByUsername',
            query: {
                'username': username,
            },
        });
    }

    /**
     * @param username 
     * @returns string OK
     * @throws ApiError
     */
    public static getPermissionByUsername(
username: string,
): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/inner/getPermissionByUsername',
            query: {
                'username': username,
            },
        });
    }

    /**
     * @param token 
     * @returns User OK
     * @throws ApiError
     */
    public static getLoginUser1(
token: string,
): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/inner/getLoginUser',
            query: {
                'token': token,
            },
        });
    }

    /**
     * @param idList 
     * @returns User OK
     * @throws ApiError
     */
    public static listByIds(
idList: Array<number>,
): CancelablePromise<Array<User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/inner/get/ids',
            query: {
                'idList': idList,
            },
        });
    }

    /**
     * @param userId 
     * @returns User OK
     * @throws ApiError
     */
    public static getById(
userId: number,
): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/inner/get/id',
            query: {
                'userId': userId,
            },
        });
    }

}
