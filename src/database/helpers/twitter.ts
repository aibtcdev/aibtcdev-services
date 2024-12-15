import { D1Orm } from 'd1-orm';
import { xBotAuthorsModel, xBotThreadsModel, xBotTweetsModel, xBotLogsModel } from '../models';

/** AUTHOR MANAGEMENT */

export async function getAuthor(orm: D1Orm, authorId: string) {
    xBotAuthorsModel.SetOrm(orm);
    const author = await xBotAuthorsModel.First({
        where: {
            author_id: authorId,
        },
    });
    return author;
}

export async function addAuthor(orm: D1Orm, authorId: string, realname?: string, username?: string) {
    xBotAuthorsModel.SetOrm(orm);
    const author = await xBotAuthorsModel.InsertOne({
        author_id: authorId,
        realname,
        username,
    });
    return author;
}

/** THREAD MANAGEMENT */

export async function createThread(orm: D1Orm) {
    xBotThreadsModel.SetOrm(orm);
    const thread = await xBotThreadsModel.InsertOne({});
    return thread;
}

export async function getThread(orm: D1Orm, threadId: number) {
    xBotThreadsModel.SetOrm(orm);
    const thread = await xBotThreadsModel.First({
        where: {
            id: threadId,
        },
    });
    return thread;
}

/** TWEET MANAGEMENT */

export async function addTweet(
    orm: D1Orm,
    authorId: string,
    tweetId: string,
    tweetBody: string,
    threadId?: number,
    parentTweetId?: string,
    isBotResponse: number = 0
) {
    xBotTweetsModel.SetOrm(orm);
    const tweet = await xBotTweetsModel.InsertOne({
        author_id: authorId,
        thread_id: threadId,
        parent_tweet_id: parentTweetId,
        tweet_id: tweetId,
        tweet_body: tweetBody,
        tweet_created_at: new Date().toISOString(),
        is_bot_response: isBotResponse,
    });
    return tweet;
}

export async function getTweet(orm: D1Orm, tweetId: string) {
    xBotTweetsModel.SetOrm(orm);
    const tweet = await xBotTweetsModel.First({
        where: {
            tweet_id: tweetId,
        },
    });
    return tweet;
}

export async function getThreadTweets(orm: D1Orm, threadId: number) {
    xBotTweetsModel.SetOrm(orm);
    const tweets = await xBotTweetsModel.All({
        where: {
            thread_id: threadId,
        },
        orderBy: [
            {
                column: 'created_at',
                descending: false,
            },
        ],
    });
    return tweets;
}

export async function getAuthorTweets(orm: D1Orm, authorId: string) {
    xBotTweetsModel.SetOrm(orm);
    const tweets = await xBotTweetsModel.All({
        where: {
            author_id: authorId,
        },
        orderBy: [
            {
                column: 'created_at',
                descending: true,
            },
        ],
    });
    return tweets;
}

/** LOG MANAGEMENT */

export async function addLog(orm: D1Orm, tweetId: string, status: string, message?: string) {
    xBotLogsModel.SetOrm(orm);
    const log = await xBotLogsModel.InsertOne({
        tweet_id: tweetId,
        tweet_status: status,
        log_message: message,
    });
    return log;
}

export async function getTweetLogs(orm: D1Orm, tweetId: string) {
    xBotLogsModel.SetOrm(orm);
    const logs = await xBotLogsModel.All({
        where: {
            tweet_id: tweetId,
        },
        orderBy: [
            {
                column: 'created_at',
                descending: true,
            },
        ],
    });
    return logs;
}
