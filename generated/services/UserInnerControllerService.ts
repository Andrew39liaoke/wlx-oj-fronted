import type { User } from '../models/User';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class UserInnerControllerService {
  /**
   * @param userId
   * @param avatarUrl
   * @returns boolean OK
   * @throws ApiError
   */
  public static updateUserAvatar(
    userId: number,
    avatarUrl: string
  ): CancelablePromise<boolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/inner/updateAvatar',
      query: {
        userId: userId,
        avatarUrl: avatarUrl,
      },
    });
  }

  /**
   * @param classId
   * @param fileInfoId
   * @returns boolean OK
   * @throws ApiError
   */
  public static updateClassFileInfoId(
    classId: number,
    fileInfoId: number
  ): CancelablePromise<boolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/inner/class/updateFileInfoId',
      query: {
        classId: classId,
        fileInfoId: fileInfoId,
      },
    });
  }

  /**
   * @param studentId
   * @returns any OK
   * @throws ApiError
   */
  public static getStudentClasses(
    studentId: number
  ): CancelablePromise<Array<Record<string, Record<string, any>>>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/getStudentClasses',
      query: {
        studentId: studentId,
      },
    });
  }

  /**
   * @param studentId
   * @returns any OK
   * @throws ApiError
   */
  public static getStudentClassProblems(
    studentId: number
  ): CancelablePromise<Array<Record<string, Record<string, any>>>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/getStudentClassProblems',
      query: {
        studentId: studentId,
      },
    });
  }

  /**
   * @param username
   * @returns string OK
   * @throws ApiError
   */
  public static getRoleNamesByUsername(
    username: string
  ): CancelablePromise<Array<string>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/getRoleNamesByUsername',
      query: {
        username: username,
      },
    });
  }

  /**
   * @param username
   * @returns string OK
   * @throws ApiError
   */
  public static getPermissionByUsername(
    username: string
  ): CancelablePromise<Array<string>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/getPermissionByUsername',
      query: {
        username: username,
      },
    });
  }

  /**
   * @param token
   * @returns User OK
   * @throws ApiError
   */
  public static getLoginUser1(token: string): CancelablePromise<User> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/getLoginUser',
      query: {
        token: token,
      },
    });
  }

  /**
   * @param idList
   * @returns User OK
   * @throws ApiError
   */
  public static listByIds(
    idList: Array<number>
  ): CancelablePromise<Array<User>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/get/ids',
      query: {
        idList: idList,
      },
    });
  }

  /**
   * @param userId
   * @returns User OK
   * @throws ApiError
   */
  public static getById(userId: number): CancelablePromise<User> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/inner/get/id',
      query: {
        userId: userId,
      },
    });
  }
}
