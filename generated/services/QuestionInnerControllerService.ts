/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Question } from '../models/Question';
import type { QuestionSubmit } from '../models/QuestionSubmit';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionInnerControllerService {

    /**
     * @param requestBody 
     * @returns boolean OK
     * @throws ApiError
     */
    public static updateQuestionSubmitById(
requestBody: QuestionSubmit,
): CancelablePromise<boolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question/inner/question_submit/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param questionId 
     * @returns QuestionSubmit OK
     * @throws ApiError
     */
    public static getQuestionSubmitById(
questionId: number,
): CancelablePromise<QuestionSubmit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/question/inner/question_submit/get/id',
            query: {
                'questionId': questionId,
            },
        });
    }

    /**
     * @param questionId 
     * @returns Question OK
     * @throws ApiError
     */
    public static getQuestionById(
questionId: number,
): CancelablePromise<Question> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/question/inner/get/id',
            query: {
                'questionId': questionId,
            },
        });
    }

}
