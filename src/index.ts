import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { AWSError, SES } from 'aws-sdk'
import { SendEmailRequest } from 'aws-sdk/clients/ses'

const printDebug = process.env.DEBUG === 'true'

interface EmailRequest {
  to: string[]
  from: string
  subject: string
  body: string
  bodyHtml?: string
}

export const handler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  debug(event)
  debug(context)

  // check api-key
  const apiKey = event.headers['x-api-key']
  if (apiKey !== process.env.API_KEY) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    }
  }

  // check body
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad Request',
      }),
    }
  }

  try {
    const emailRequest = JSON.parse(event.body) as EmailRequest

    if (
      !emailRequest.to ||
      !emailRequest.to.length ||
      !emailRequest.from ||
      !emailRequest.subject ||
      !emailRequest.body
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Bad Request',
        }),
      }
    }

    const ses = new SES()
    const totalReceivers = emailRequest.to.length
    let currentReceiver = 0
    for (const receiver of emailRequest.to) {
      const params: SendEmailRequest = {
        Source: emailRequest.from,
        Destination: {
          ToAddresses: [receiver],
        },
        Message: {
          Body: {
            Text: {
              Data: emailRequest.body,
            },
            Html: {
              Data: emailRequest.bodyHtml ?? '',
            },
          },
          Subject: {
            Data: emailRequest.subject,
          },
        },
      }

      debug(params)
      await ses.sendEmail(params).promise()
      if (currentReceiver++ < totalReceivers) {
        await new Promise((resolve) => setTimeout(resolve, 100)) // wait 100ms, avoid rate limit
      }
    }
  } catch (error) {
    const errorData = error as AWSError
    console.error(`Error: ${JSON.stringify(error, null, 2)}`)
    return {
      statusCode: errorData.statusCode ?? 500,
      body: JSON.stringify({
        message: errorData.message ?? 'Internal Server Error',
      }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'ok',
    }),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debug = (data: any) => {
  if (printDebug) {
    console.log(`Debug: ${JSON.stringify(data, null, 2)}`)
  }
}
