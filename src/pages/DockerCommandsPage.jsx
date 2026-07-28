import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag } from 'antd'
import { ReadOutlined, SearchOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const COMMANDS = [
  { cmd: 'docker build -t <nome> .', pt: 'Constrói uma imagem a partir do Dockerfile no diretório atual', en: 'Builds an image from the Dockerfile in the current directory', cat: 'build' },
  { cmd: 'docker images', pt: 'Lista as imagens locais', en: 'Lists local images', cat: 'build' },
  { cmd: 'docker rmi <imagem>', pt: 'Remove uma imagem local', en: 'Removes a local image', cat: 'build' },
  { cmd: 'docker run -d -p 8080:80 <imagem>', pt: 'Roda um container em background, mapeando a porta 80 do container pra 8080 do host', en: 'Runs a container in the background, mapping container port 80 to host port 8080', cat: 'run' },
  { cmd: 'docker run -it <imagem> sh', pt: 'Roda um container interativo com shell aberto', en: 'Runs an interactive container with an open shell', cat: 'run' },
  { cmd: 'docker run --rm <imagem>', pt: 'Roda um container e remove automaticamente ao sair', en: 'Runs a container and removes it automatically on exit', cat: 'run' },
  { cmd: 'docker ps', pt: 'Lista containers em execução', en: 'Lists running containers', cat: 'inspect' },
  { cmd: 'docker ps -a', pt: 'Lista todos os containers, incluindo parados', en: 'Lists all containers, including stopped ones', cat: 'inspect' },
  { cmd: 'docker logs -f <container>', pt: 'Mostra os logs do container e continua acompanhando em tempo real', en: 'Shows container logs and keeps following in real time', cat: 'inspect' },
  { cmd: 'docker inspect <container>', pt: 'Mostra detalhes completos (JSON) de um container ou imagem', en: 'Shows full details (JSON) of a container or image', cat: 'inspect' },
  { cmd: 'docker stats', pt: 'Mostra uso de CPU/memória dos containers em tempo real', en: 'Shows live CPU/memory usage of containers', cat: 'inspect' },
  { cmd: 'docker exec -it <container> sh', pt: 'Abre um shell dentro de um container já rodando', en: 'Opens a shell inside an already running container', cat: 'inspect' },
  { cmd: 'docker stop <container>', pt: 'Para um container em execução (sinal gracioso, com timeout)', en: 'Stops a running container (graceful signal, with timeout)', cat: 'lifecycle' },
  { cmd: 'docker start <container>', pt: 'Inicia um container parado', en: 'Starts a stopped container', cat: 'lifecycle' },
  { cmd: 'docker restart <container>', pt: 'Reinicia um container', en: 'Restarts a container', cat: 'lifecycle' },
  { cmd: 'docker rm <container>', pt: 'Remove um container parado', en: 'Removes a stopped container', cat: 'lifecycle' },
  { cmd: 'docker rm -f <container>', pt: 'Força a remoção de um container, mesmo rodando', en: 'Forces removal of a container, even if running', cat: 'lifecycle' },
  { cmd: 'docker system prune', pt: 'Remove containers parados, redes e imagens não usadas', en: 'Removes stopped containers, unused networks and images', cat: 'lifecycle' },
  { cmd: 'docker system prune -a --volumes', pt: 'Limpeza agressiva: também remove imagens não usadas por nenhum container e volumes órfãos (destrutivo)', en: 'Aggressive cleanup: also removes images unused by any container and orphan volumes (destructive)', cat: 'lifecycle' },
  { cmd: 'docker volume ls', pt: 'Lista volumes', en: 'Lists volumes', cat: 'volumes' },
  { cmd: 'docker volume rm <volume>', pt: 'Remove um volume', en: 'Removes a volume', cat: 'volumes' },
  { cmd: 'docker cp <container>:/caminho ./local', pt: 'Copia um arquivo/pasta de dentro do container pro host', en: 'Copies a file/folder from inside the container to the host', cat: 'volumes' },
  { cmd: 'docker network ls', pt: 'Lista redes Docker', en: 'Lists Docker networks', cat: 'network' },
  { cmd: 'docker network inspect <rede>', pt: 'Mostra detalhes de uma rede, incluindo containers conectados', en: 'Shows details of a network, including connected containers', cat: 'network' },
  { cmd: 'docker compose up -d', pt: 'Sobe todos os serviços do compose.yaml em background', en: 'Brings up all services from compose.yaml in the background', cat: 'compose' },
  { cmd: 'docker compose down', pt: 'Para e remove containers, redes criadas pelo compose up', en: 'Stops and removes containers, networks created by compose up', cat: 'compose' },
  { cmd: 'docker compose build', pt: 'Constrói (ou reconstrói) as imagens dos serviços', en: 'Builds (or rebuilds) the services\' images', cat: 'compose' },
  { cmd: 'docker compose logs -f <serviço>', pt: 'Acompanha os logs de um serviço específico', en: 'Follows the logs of a specific service', cat: 'compose' },
  { cmd: 'docker compose ps', pt: 'Lista os serviços e o status de cada container', en: 'Lists services and each container\'s status', cat: 'compose' },
  { cmd: 'docker compose restart <serviço>', pt: 'Reinicia um serviço específico sem recriar os outros', en: 'Restarts a specific service without recreating the others', cat: 'compose' },
  { cmd: 'docker compose exec <serviço> sh', pt: 'Abre um shell num serviço já rodando via compose', en: 'Opens a shell in a service already running via compose', cat: 'compose' },
  { cmd: 'docker tag <imagem> <repo>:<tag>', pt: 'Cria uma tag nova apontando pra mesma imagem, útil antes de dar push', en: 'Creates a new tag pointing to the same image, useful before pushing', cat: 'registry' },
  { cmd: 'docker push <repo>:<tag>', pt: 'Envia uma imagem pra um registry remoto', en: 'Pushes an image to a remote registry', cat: 'registry' },
  { cmd: 'docker pull <imagem>', pt: 'Baixa uma imagem de um registry', en: 'Downloads an image from a registry', cat: 'registry' },
  { cmd: 'docker login', pt: 'Autentica com um registry (Docker Hub por padrão)', en: 'Authenticates with a registry (Docker Hub by default)', cat: 'registry' },
]

const translations = {
  pt: {
    title: 'Comandos Docker & Docker Compose',
    intro: 'Referência rápida e pesquisável dos comandos Docker e Docker Compose mais usados no dia a dia, com uma descrição curta de cada um.',
    search: 'Buscar comando ou descrição...',
    empty: 'Nenhum comando encontrado.',
  },
  en: {
    title: 'Docker & Docker Compose Commands',
    intro: 'A quick, searchable reference of the most commonly used Docker and Docker Compose commands, each with a short description.',
    search: 'Search command or description...',
    empty: 'No command found.',
  },
}

export default function DockerCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((c) => c.cmd.toLowerCase().includes(q) || c[lang].toLowerCase().includes(q))
  }, [query, lang])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Input
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search}
        allowClear
      />

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                <Space>
                  <Text code style={{ fontSize: 14 }}>{item.cmd}</Text>
                  <Tag>{item.cat}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
