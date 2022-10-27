# aws-ses-node-lambda-proxy

A nodejs lambda that exposes a function url that can be used as a proxy to send emails using [AWS SES](https://aws.amazon.com/ses/). Before sending any emails using SES you need to follow the [Getting started guide](https://aws.amazon.com/ses/getting-started/).

## Installation

Clone the repo

```bash
git clone https://github.com/martinhjartmyr/aws-ses-node-lambda-proxy.git && cd aws-ses-node-lambda-proxy
```

Install deps

```bash
yarn install
```

Build the lambda

```bash
yarn build
```

Create an AWS IAM Role and attach required policys

```bash
aws iam create-role --role-name ses-proxy --assume-role-policy-document file://trust-policy.json && aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --role-name ses-proxy && aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess --role-name ses-proxy
```

Copy the Arn from the output and use it in the next step.

```
arn:aws:iam::123456789:role/ses-proxy
```

Create the lambda function with a 10 second timeout, 256mb of memory and use the role arn from the output above

```bash
aws lambda create-function --function-name ses-proxy --runtime "nodejs16.x" --timeout 10 --memory-size 256 --zip-file "fileb://dist/index.zip" --handler index.handler --role [!!! CHANGE ME ROLE FROM ABOVE OUTPUT !!!]
```

Set the required environment API_KEY secret

```bash
aws lambda update-function-configuration --function-name ses-proxy --environment "Variables={API_KEY=[!!! CHANGE ME!!!],DEBUG=false}"
```

Create a function URL. The output will display the generated URL that will be publicly accessible.

```bash
aws lambda create-function-url-config --function-name ses-proxy --auth-type NONE
```

Grant access to call the lambda function from the url

```bash
aws lambda add-permission --function-name ses-proxy --statement-id AuthNone --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE
```

Congrats, you should now be able to use the proxy to send emails. Give it a try using the curl example below.

## Usage

```bash
curl --location --request POST 'https://[!!! CHANGE_ME !!!].lambda-url.eu-north-1.on.aws/' \
--header 'x-api-key: [!!! CHANGE ME_!!!]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "to": ["receiver@test.com", "receiver-2@test.com"],
    "from": "from@test.com",
    "subject": "Testing subject",
    "bodyHtml": "<html>Testing! <a href=\"https://www.google.com\">Google.com</a></html>",
    "body": "Testing"
}'
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
