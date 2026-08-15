import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CloudOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'config',
  'sts',
  'iam',
  's3',
  'ec2',
  'ecr',
  'ecs',
  'lambda',
  'logs',
  'dynamodb',
  'sns',
  'sqs',
  'kms',
  'secrets',
  'rds',
  'route53',
  'cfn',
]

const CATEGORY_COLOR = {
  config: 'blue',
  sts: 'purple',
  iam: 'volcano',
  s3: 'cyan',
  ec2: 'geekblue',
  ecr: 'magenta',
  ecs: 'orange',
  lambda: 'gold',
  logs: 'lime',
  dynamodb: 'blue',
  sns: 'red',
  sqs: 'green',
  kms: 'purple',
  secrets: 'pink',
  rds: 'blue',
  route53: 'green',
  cfn: 'gold',
}

const labelOf = {
  config: { pt: 'Configuração', en: 'Configuration' },
  sts: { pt: 'STS & identidade', en: 'STS & identity' },
  iam: { pt: 'IAM', en: 'IAM' },
  s3: { pt: 'S3', en: 'S3' },
  ec2: { pt: 'EC2', en: 'EC2' },
  ecr: { pt: 'ECR', en: 'ECR' },
  ecs: { pt: 'ECS', en: 'ECS' },
  lambda: { pt: 'Lambda', en: 'Lambda' },
  logs: { pt: 'CloudWatch Logs', en: 'CloudWatch Logs' },
  dynamodb: { pt: 'DynamoDB', en: 'DynamoDB' },
  sns: { pt: 'SNS', en: 'SNS' },
  sqs: { pt: 'SQS', en: 'SQS' },
  kms: { pt: 'KMS', en: 'KMS' },
  secrets: { pt: 'Secrets Manager', en: 'Secrets Manager' },
  rds: { pt: 'RDS', en: 'RDS' },
  route53: { pt: 'Route 53', en: 'Route 53' },
  cfn: { pt: 'CloudFormation', en: 'CloudFormation' },
}

const COMMANDS = [
  // ─── Configuração / Configuration ─────────────────────────────────────────
  { cmd: 'aws configure', cat: 'config', pt: 'Assistente interativo: credenciais, região e formato de saída', en: 'Interactive wizard: credentials, default region and output format' },
  { cmd: 'aws configure list', cat: 'config', pt: 'Mostra a configuração ativa e de onde veio', en: 'Shows the active config and its source' },
  { cmd: 'aws configure list-profiles', cat: 'config', pt: 'Lista os perfis definidos em ~/.aws/config e ~/.aws/credentials', en: 'Lists profiles from ~/.aws/config and ~/.aws/credentials' },
  { cmd: 'aws --profile producao --region us-east-1 s3 ls', cat: 'config', pt: 'Usa um perfil e região específicos em um comando só', en: 'Uses a specific profile and region in a single command' },
  { cmd: 'aws --output table sts get-caller-identity', cat: 'config', pt: 'Troca o formato de saída (json | table | text | yaml)', en: 'Changes the output format (json | table | text | yaml)' },
  { cmd: 'aws --endpoint-url http://localhost:4566 s3 ls', cat: 'config', pt: 'Aponta para um endpoint customizado (ex: LocalStack)', en: 'Points to a custom endpoint (e.g., LocalStack)' },
  { cmd: 'export AWS_PAGER=""', cat: 'config', pt: 'Desabilita o pager (--no-pager também funciona por comando)', en: 'Disables the pager (--no-pager also works per command)' },

  // ─── STS & identidade ───────────────────────────────────────────────────────
  { cmd: 'aws sts get-caller-identity', cat: 'sts', pt: 'Testa se as credenciais funcionam e mostra Account/Arn/UserId', en: 'Tests credentials and shows Account/Arn/UserId' },
  { cmd: 'aws sts get-session-token --duration-seconds 3600', cat: 'sts', pt: 'Gera credenciais temporárias (AccessKeyId, SecretAccessKey, SessionToken)', en: 'Generates temporary credentials' },
  { cmd: 'aws sts assume-role --role-arn arn:aws:iam::123456789012:role/MinhaRole --role-session-name sessao-cli', cat: 'sts', pt: 'Assume uma role e retorna credenciais temporárias', en: 'Assumes a role and returns temporary credentials' },
  { cmd: 'aws sts assume-role-with-web-identity --role-arn ... --web-identity-token ... --role-session-name ci', cat: 'sts', pt: 'Assume role via token OIDC (GitHub Actions, EKS, etc)', en: 'Assumes a role via OIDC token (GitHub Actions, EKS, etc)' },
  { cmd: 'aws sts decode-authorization-message --encoded-message <mensagem>', cat: 'sts', pt: 'Decodifica mensagens de acesso negado criptografadas', en: 'Decodes encrypted access-denied messages' },

  // ─── IAM ────────────────────────────────────────────────────────────────────
  { cmd: 'aws iam list-users', cat: 'iam', pt: 'Lista usuários IAM', en: 'Lists IAM users' },
  { cmd: 'aws iam list-roles', cat: 'iam', pt: 'Lista roles IAM', en: 'Lists IAM roles' },
  { cmd: 'aws iam list-policies --scope Local', cat: 'iam', pt: 'Lista políticas gerenciadas pela conta (Local) ou pela AWS (AWS)', en: 'Lists customer-managed policies (Local) or AWS-managed (AWS)' },
  { cmd: 'aws iam get-user --user-name jose.silva', cat: 'iam', pt: 'Detalhes de um usuário', en: 'User details' },
  { cmd: 'aws iam create-access-key --user-name jose.silva', cat: 'iam', pt: 'Cria novas access keys para o usuário', en: 'Creates new access keys for the user' },
  { cmd: 'aws iam update-access-key --access-key-id AKIA... --status Inactive --user-name jose.silva', cat: 'iam', pt: 'Desativa uma access key sem apagá-la', en: 'Deactivates an access key without deleting it' },
  { cmd: 'aws iam delete-access-key --access-key-id AKIA... --user-name jose.silva', cat: 'iam', pt: 'Apaga uma access key', en: 'Deletes an access key' },
  { cmd: 'aws iam attach-user-policy --user-name jose.silva --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess', cat: 'iam', pt: 'Anexa uma policy gerenciada ao usuário', en: 'Attaches a managed policy to the user' },
  { cmd: 'aws iam list-attached-user-policies --user-name jose.silva', cat: 'iam', pt: 'Lista policies anexas a um usuário', en: 'Lists policies attached to a user' },
  { cmd: 'aws iam list-groups-for-user --user-name jose.silva', cat: 'iam', pt: 'Lista grupos do usuário', en: 'Lists groups the user belongs to' },
  { cmd: 'aws iam get-policy-version --policy-arn arn:aws:iam::123456789012:policy/MinhaPolicy --version-id v1', cat: 'iam', pt: 'Mostra o JSON de uma versão específica de policy', en: 'Shows the JSON of a specific policy version' },

  // ─── S3 ─────────────────────────────────────────────────────────────────────
  { cmd: 'aws s3 ls', cat: 's3', pt: 'Lista buckets da conta', en: 'Lists account buckets' },
  { cmd: 'aws s3 ls s3://bucket-name/', cat: 's3', pt: 'Lista objetos do bucket', en: 'Lists objects in a bucket' },
  { cmd: 'aws s3 mb s3://bucket-name', cat: 's3', pt: 'Cria um bucket', en: 'Creates a bucket' },
  { cmd: 'aws s3 rb s3://bucket-name --force', cat: 's3', pt: 'Remove bucket e todo o conteúdo (cuidado!)', en: 'Removes bucket and all contents (careful!)' },
  { cmd: 'aws s3 cp arquivo.txt s3://bucket-name/', cat: 's3', pt: 'Envia arquivo para o S3', en: 'Uploads a file to S3' },
  { cmd: 'aws s3 cp s3://bucket-name/arquivo.txt .', cat: 's3', pt: 'Baixa arquivo do S3', en: 'Downloads a file from S3' },
  { cmd: 'aws s3 cp - s3://bucket-name/arquivo.txt', cat: 's3', pt: 'Envia dados do stdin para o S3', en: 'Uploads stdin data to S3' },
  { cmd: 'aws s3 sync ./pasta s3://bucket-name/prefixo/', cat: 's3', pt: 'Sincroniza pasta local com o S3', en: 'Syncs a local folder to S3' },
  { cmd: 'aws s3 sync s3://bucket-name/prefixo/ ./pasta', cat: 's3', pt: 'Sincroniza do S3 para o disco local', en: 'Syncs S3 to a local folder' },
  { cmd: 'aws s3 rm s3://bucket-name/arquivo.txt', cat: 's3', pt: 'Apaga um objeto', en: 'Deletes an object' },
  { cmd: 'aws s3 rm s3://bucket-name/prefixo/ --recursive', cat: 's3', pt: 'Apaga recursivamente um prefixo', en: 'Recursively deletes a prefix' },
  { cmd: 'aws s3 presign s3://bucket-name/arquivo.txt --expires-in 3600', cat: 's3', pt: 'Gera URL pré-assinada temporária', en: 'Generates a temporary presigned URL' },
  { cmd: 'aws s3api list-buckets', cat: 's3', pt: 'Resposta JSON detalhada dos buckets', en: 'Detailed JSON response of buckets' },
  { cmd: 'aws s3api get-object-acl --bucket bucket-name --key arquivo.txt', cat: 's3', pt: 'Mostra ACL de um objeto', en: 'Shows the ACL of an object' },
  { cmd: 'aws s3 website s3://bucket-name/ --index-document index.html --error-document error.html', cat: 's3', pt: 'Configura bucket como site estático', en: 'Configures bucket as a static website' },

  // ─── EC2 ──────────────────────────────────────────────────────────────────
  { cmd: 'aws ec2 describe-instances', cat: 'ec2', pt: 'Lista/resumo de instâncias', en: 'Lists/summarizes instances' },
  { cmd: 'aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"', cat: 'ec2', pt: 'Filtra instâncias em execução', en: 'Filters running instances' },
  { cmd: 'aws ec2 start-instances --instance-ids i-0123456789abcdef0', cat: 'ec2', pt: 'Liga uma instância', en: 'Starts an instance' },
  { cmd: 'aws ec2 stop-instances --instance-ids i-0123456789abcdef0', cat: 'ec2', pt: 'Desliga uma instância', en: 'Stops an instance' },
  { cmd: 'aws ec2 terminate-instances --instance-ids i-0123456789abcdef0', cat: 'ec2', pt: 'Termina uma instância', en: 'Terminates an instance' },
  { cmd: 'aws ec2 describe-images --owners self', cat: 'ec2', pt: 'Lista AMIs próprias', en: 'Lists own AMIs' },
  { cmd: 'aws ec2 describe-key-pairs', cat: 'ec2', pt: 'Lista key pairs', en: 'Lists key pairs' },
  { cmd: "aws ec2 create-key-pair --key-name minha-chave --query 'KeyMaterial' --output text > minha-chave.pem", cat: 'ec2', pt: 'Cria key pair e salva a chave privada', en: 'Creates a key pair and saves the private key' },
  { cmd: 'aws ec2 describe-security-groups', cat: 'ec2', pt: 'Lista security groups', en: 'Lists security groups' },
  { cmd: 'aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 22 --cidr 203.0.113.0/24', cat: 'ec2', pt: 'Libera porta de entrada no security group', en: 'Opens an inbound port on a security group' },
  { cmd: 'aws ec2 describe-vpcs', cat: 'ec2', pt: 'Lista VPCs', en: 'Lists VPCs' },
  { cmd: 'aws ec2 describe-subnets', cat: 'ec2', pt: 'Lista subnets', en: 'Lists subnets' },
  { cmd: 'aws ec2 describe-volumes', cat: 'ec2', pt: 'Lista volumes EBS', en: 'Lists EBS volumes' },

  // ─── ECR ──────────────────────────────────────────────────────────────────
  { cmd: 'aws ecr describe-repositories', cat: 'ecr', pt: 'Lista repositórios', en: 'Lists repositories' },
  { cmd: 'aws ecr create-repository --repository-name minha-app', cat: 'ecr', pt: 'Cria repositório de imagens', en: 'Creates an image repository' },
  { cmd: 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com', cat: 'ecr', pt: 'Autentica o Docker no ECR', en: 'Authenticates Docker with ECR' },
  { cmd: 'aws ecr describe-images --repository-name minha-app', cat: 'ecr', pt: 'Lista imagens/tags do repositório', en: 'Lists images/tags in the repository' },

  // ─── ECS ──────────────────────────────────────────────────────────────────
  { cmd: 'aws ecs list-clusters', cat: 'ecs', pt: 'Lista clusters', en: 'Lists clusters' },
  { cmd: 'aws ecs describe-clusters --clusters meu-cluster', cat: 'ecs', pt: 'Detalhes do cluster', en: 'Cluster details' },
  { cmd: 'aws ecs list-services --cluster meu-cluster', cat: 'ecs', pt: 'Lista serviços do cluster', en: 'Lists cluster services' },
  { cmd: 'aws ecs describe-services --cluster meu-cluster --services meu-servico', cat: 'ecs', pt: 'Detalhes de um serviço', en: 'Service details' },
  { cmd: 'aws ecs list-tasks --cluster meu-cluster', cat: 'ecs', pt: 'Lista tasks', en: 'Lists tasks' },
  { cmd: 'aws ecs describe-tasks --cluster meu-cluster --tasks arn:aws:ecs:...', cat: 'ecs', pt: 'Detalhes de tasks específicas', en: 'Specific task details' },
  { cmd: 'aws ecs update-service --cluster meu-cluster --service meu-servico --desired-count 2', cat: 'ecs', pt: 'Altera número desejado de tasks', en: 'Changes desired task count' },
  { cmd: 'aws ecs run-task --cluster meu-cluster --task-definition minha-task:1', cat: 'ecs', pt: 'Roda uma task avulsa', en: 'Runs a standalone task' },

  // ─── Lambda ─────────────────────────────────────────────────────────────────
  { cmd: 'aws lambda list-functions', cat: 'lambda', pt: 'Lista funções', en: 'Lists functions' },
  { cmd: 'aws lambda get-function --function-name minha-funcao', cat: 'lambda', pt: 'Detalhes e local do pacote', en: 'Details and package location' },
  { cmd: "aws lambda invoke --function-name minha-funcao --payload '{}' out.json", cat: 'lambda', pt: 'Invoca função e salva resposta', en: 'Invokes a function and saves the response' },
  { cmd: 'aws lambda invoke --function-name minha-funcao --cli-binary-format raw-in-base64-out --payload fileb://event.json out.json', cat: 'lambda', pt: 'Invoca com payload de arquivo', en: 'Invokes with a payload file' },
  { cmd: 'aws lambda update-function-code --function-name minha-funcao --zip-file fileb://function.zip', cat: 'lambda', pt: 'Atualiza o código da função', en: 'Updates function code' },
  { cmd: 'aws lambda update-function-configuration --function-name minha-funcao --timeout 30 --memory-size 512', cat: 'lambda', pt: 'Altera timeout e memória', en: 'Changes timeout and memory' },
  { cmd: 'aws lambda publish-version --function-name minha-funcao', cat: 'lambda', pt: 'Publica uma nova versão imutável', en: 'Publishes a new immutable version' },
  { cmd: 'aws lambda create-alias --function-name minha-funcao --name prod --function-version 1', cat: 'lambda', pt: 'Cria um alias apontando para uma versão', en: 'Creates an alias pointing to a version' },

  // ─── CloudWatch Logs ──────────────────────────────────────────────────────
  { cmd: 'aws logs describe-log-groups', cat: 'logs', pt: 'Lista log groups', en: 'Lists log groups' },
  { cmd: 'aws logs tail /aws/lambda/minha-funcao --follow', cat: 'logs', pt: 'Acompanha logs em tempo real', en: 'Tails logs in real time' },
  { cmd: 'aws logs filter-log-events --log-group-name /aws/lambda/minha-funcao --filter-pattern "ERROR"', cat: 'logs', pt: 'Busca eventos com padrão', en: 'Searches events by pattern' },
  { cmd: 'aws logs get-log-events --log-group-name /app/logs --log-stream-name ...', cat: 'logs', pt: 'Pega eventos de um stream específico', en: 'Gets events from a specific stream' },
  { cmd: 'aws logs create-log-group --log-group-name /app/logs', cat: 'logs', pt: 'Cria log group', en: 'Creates a log group' },

  // ─── DynamoDB ─────────────────────────────────────────────────────────────
  { cmd: 'aws dynamodb list-tables', cat: 'dynamodb', pt: 'Lista tabelas', en: 'Lists tables' },
  { cmd: 'aws dynamodb describe-table --table-name minha-tabela', cat: 'dynamodb', pt: 'Detalhes da tabela', en: 'Table details' },
  { cmd: 'aws dynamodb scan --table-name minha-tabela', cat: 'dynamodb', pt: 'Scan completo (cuidado em produção)', en: 'Full scan (be careful in production)' },
  { cmd: 'aws dynamodb query --table-name minha-tabela --key-condition-expression "PK = :pk" --expression-attribute-values \'{":pk":{"S":"valor"}}\'', cat: 'dynamodb', pt: 'Query pela chave de partição', en: 'Query by partition key' },
  { cmd: 'aws dynamodb put-item --table-name minha-tabela --item \'{"id":{"S":"1"},"nome":{"S":"Dev"}}\'', cat: 'dynamodb', pt: 'Insere um item', en: 'Puts an item' },
  { cmd: 'aws dynamodb get-item --table-name minha-tabela --key \'{"id":{"S":"1"}}\'', cat: 'dynamodb', pt: 'Lê um item pela chave', en: 'Gets an item by key' },
  { cmd: 'aws dynamodb delete-item --table-name minha-tabela --key \'{"id":{"S":"1"}}\'', cat: 'dynamodb', pt: 'Apaga um item', en: 'Deletes an item' },

  // ─── SNS ──────────────────────────────────────────────────────────────────
  { cmd: 'aws sns list-topics', cat: 'sns', pt: 'Lista tópicos', en: 'Lists topics' },
  { cmd: 'aws sns create-topic --name meu-topico', cat: 'sns', pt: 'Cria tópico', en: 'Creates a topic' },
  { cmd: 'aws sns subscribe --topic-arn arn:aws:sns:us-east-1:123456789012:meu-topico --protocol email --notification-endpoint eu@example.com', cat: 'sns', pt: 'Inscreve endpoint no tópico', en: 'Subscribes an endpoint to the topic' },
  { cmd: 'aws sns publish --topic-arn arn:aws:sns:us-east-1:123456789012:meu-topico --message "hello"', cat: 'sns', pt: 'Publica mensagem no tópico', en: 'Publishes a message to the topic' },
  { cmd: 'aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:123456789012:meu-topico', cat: 'sns', pt: 'Lista inscrições do tópico', en: 'Lists topic subscriptions' },

  // ─── SQS ──────────────────────────────────────────────────────────────────
  { cmd: 'aws sqs list-queues', cat: 'sqs', pt: 'Lista filas', en: 'Lists queues' },
  { cmd: 'aws sqs create-queue --queue-name minha-fila', cat: 'sqs', pt: 'Cria fila', en: 'Creates a queue' },
  { cmd: 'aws sqs send-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila --message-body "hello"', cat: 'sqs', pt: 'Envia mensagem', en: 'Sends a message' },
  { cmd: 'aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila', cat: 'sqs', pt: 'Recebe uma mensagem', en: 'Receives a message' },
  { cmd: 'aws sqs delete-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila --receipt-handle <handle>', cat: 'sqs', pt: 'Deleta mensagem após processamento', en: 'Deletes a message after processing' },
  { cmd: 'aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/minha-fila --attribute-names All', cat: 'sqs', pt: 'Atributos da fila (ex: ApproximateNumberOfMessages)', en: 'Queue attributes (e.g., ApproximateNumberOfMessages)' },

  // ─── KMS ────────────────────────────────────────────────────────────────────
  { cmd: 'aws kms list-keys', cat: 'kms', pt: 'Lista chaves', en: 'Lists keys' },
  { cmd: 'aws kms list-aliases', cat: 'kms', pt: 'Lista aliases', en: 'Lists aliases' },
  { cmd: 'aws kms encrypt --key-id alias/minha-chave --plaintext "hello" --output text --query CiphertextBlob | base64 -d > criptografado.bin', cat: 'kms', pt: 'Criptografa texto', en: 'Encrypts text' },
  { cmd: 'aws kms decrypt --ciphertext-blob fileb://criptografado.bin --output text --query Plaintext | base64 -d', cat: 'kms', pt: 'Descriptografa dados', en: 'Decrypts data' },
  { cmd: 'aws kms enable-key-rotation --key-id alias/minha-chave', cat: 'kms', pt: 'Habilita rotação automática de chave', en: 'Enables automatic key rotation' },

  // ─── Secrets Manager ────────────────────────────────────────────────────────
  { cmd: 'aws secretsmanager list-secrets', cat: 'secrets', pt: 'Lista segredos', en: 'Lists secrets' },
  { cmd: 'aws secretsmanager get-secret-value --secret-id meu-segredo', cat: 'secrets', pt: 'Lê o valor de um segredo', en: 'Reads a secret value' },
  { cmd: 'aws secretsmanager create-secret --name meu-segredo --secret-string \'{"key":"value"}\'', cat: 'secrets', pt: 'Cria segredo com JSON', en: 'Creates a secret with JSON' },
  { cmd: 'aws secretsmanager put-secret-value --secret-id meu-segredo --secret-string nova-senha', cat: 'secrets', pt: 'Atualiza o valor do segredo', en: 'Updates the secret value' },
  { cmd: 'aws secretsmanager rotate-secret --secret-id meu-segredo', cat: 'secrets', pt: 'Gira/rotaciona o segredo', en: 'Rotates the secret' },

  // ─── RDS ──────────────────────────────────────────────────────────────────
  { cmd: 'aws rds describe-db-instances', cat: 'rds', pt: 'Lista instâncias de banco', en: 'Lists DB instances' },
  { cmd: 'aws rds describe-db-clusters', cat: 'rds', pt: 'Lista clusters Aurora', en: 'Lists Aurora clusters' },
  { cmd: 'aws rds create-db-snapshot --db-instance-identifier meu-db --db-snapshot-identifier snapshot-1', cat: 'rds', pt: 'Cria snapshot de instância', en: 'Creates a DB snapshot' },
  { cmd: 'aws rds describe-db-snapshots', cat: 'rds', pt: 'Lista snapshots', en: 'Lists snapshots' },

  // ─── Route 53 ─────────────────────────────────────────────────────────────
  { cmd: 'aws route53 list-hosted-zones', cat: 'route53', pt: 'Lista hosted zones', en: 'Lists hosted zones' },
  { cmd: 'aws route53 list-resource-record-sets --hosted-zone-id Z123456789', cat: 'route53', pt: 'Lista registros de uma zona', en: 'Lists records in a zone' },
  { cmd: 'aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file:///caminho/batch.json', cat: 'route53', pt: 'Aplica lote de alterações de DNS', en: 'Applies a batch of DNS changes' },
  { cmd: 'aws route53 test-dns-answer --hosted-zone-id Z123456789 --record-name www.example.com --record-type A', cat: 'route53', pt: 'Testa resposta DNS sem cache', en: 'Tests DNS answer without cache' },

  // ─── CloudFormation ─────────────────────────────────────────────────────────
  { cmd: 'aws cloudformation list-stacks', cat: 'cfn', pt: 'Lista stacks', en: 'Lists stacks' },
  { cmd: 'aws cloudformation create-stack --stack-name minha-stack --template-body file:///caminho/template.yaml', cat: 'cfn', pt: 'Cria stack a partir de template', en: 'Creates a stack from a template' },
  { cmd: 'aws cloudformation update-stack --stack-name minha-stack --template-body file:///caminho/template.yaml', cat: 'cfn', pt: 'Atualiza stack existente', en: 'Updates an existing stack' },
  { cmd: 'aws cloudformation delete-stack --stack-name minha-stack', cat: 'cfn', pt: 'Deleta stack', en: 'Deletes a stack' },
  { cmd: 'aws cloudformation describe-stacks --stack-name minha-stack', cat: 'cfn', pt: 'Detalhes e outputs da stack', en: 'Stack details and outputs' },
  { cmd: 'aws cloudformation describe-stack-events --stack-name minha-stack', cat: 'cfn', pt: 'Eventos da stack (útil pra debug)', en: 'Stack events (useful for debugging)' },
  { cmd: 'aws cloudformation validate-template --template-body file://template.yaml', cat: 'cfn', pt: 'Valida sintaxe do template', en: 'Validates template syntax' },
  { cmd: 'aws cloudformation package --template-file template.yaml --s3-bucket bucket --output-template-file packaged.yaml', cat: 'cfn', pt: 'Faz upload de artefatos locais para S3 e gera template empacotado', en: 'Uploads local artifacts to S3 and outputs packaged template' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de AWS CLI',
    intro: (
      <>
        Referência pesquisável do <Text code>aws</Text> — perfis, regiões, S3,
        EC2, IAM, Lambda, CloudWatch Logs, DynamoDB, Secrets Manager, RDS,
        Route 53 e CloudFormation. Tudo 100% client-side (só texto de
        referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        A AWS CLI resolve credenciais e região na ordem: variáveis de ambiente
        (<Text code>AWS_ACCESS_KEY_ID</Text>,{' '}
        <Text code>AWS_SECRET_ACCESS_KEY</Text>,{' '}
        <Text code>AWS_REGION</Text>) {'>'} flags de linha (
        <Text code>--profile</Text>, <Text code>--region</Text>) {'>'} arquivos{' '}
        <Text code>~/.aws/credentials</Text> e <Text code>~/.aws/config</Text>.
        Use <Text code>aws sts get-caller-identity</Text> para testar se tudo
        funciona, <Text code>--output json|table|text|yaml</Text> para mudar o
        formato e <Text code>--endpoint-url</Text> para apontar para LocalStack
        ou outro mock.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'AWS CLI Cheat Sheet',
    intro: (
      <>
        A searchable <Text code>aws</Text> reference — profiles, regions, S3,
        EC2, IAM, Lambda, CloudWatch Logs, DynamoDB, Secrets Manager, RDS,
        Route 53 and CloudFormation. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        The AWS CLI resolves credentials and region in this order: environment
        variables (<Text code>AWS_ACCESS_KEY_ID</Text>,{' '}
        <Text code>AWS_SECRET_ACCESS_KEY</Text>,{' '}
        <Text code>AWS_REGION</Text>) {'>'} command-line flags (
        <Text code>--profile</Text>, <Text code>--region</Text>) {'>'}{' '}
        <Text code>~/.aws/credentials</Text> and{' '}
        <Text code>~/.aws/config</Text>. Use{' '}
        <Text code>aws sts get-caller-identity</Text> to test your setup,{' '}
        <Text code>--output json|table|text|yaml</Text> to change output, and{' '}
        <Text code>--endpoint-url</Text> to point at LocalStack or another mock.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function AwsCliCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\\|/g, '\\\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\\|/g, '\\\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><CloudOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CloudOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}
