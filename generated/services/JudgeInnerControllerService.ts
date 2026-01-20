/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionSubmit } from '../models/QuestionSubmit';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class JudgeInnerControllerService {

    /**
     * @param questionSubmitId 
     * @returns QuestionSubmit OK
     * @throws ApiError
     */
    public static doJudge(
questionSubmitId: number,
): CancelablePromise<QuestionSubmit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/judge/inner/do',
            query: {
                'questionSubmitId': questionSubmitId,
            },
        });
    }

}
