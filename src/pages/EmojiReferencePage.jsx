import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Space, Input, Radio, Tag, Button, Collapse, message, Tooltip, Card, Row, Col } from 'antd'
import { SearchOutlined, CopyOutlined, SmileOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  { key: 'smileys', pt: 'Caras & Emoções', en: 'Smileys & Emotion' },
  { key: 'people', pt: 'Pessoas & Gestos', en: 'People & Body' },
  { key: 'animals', pt: 'Animais & Natureza', en: 'Animals & Nature' },
  { key: 'food', pt: 'Comida & Bebida', en: 'Food & Drink' },
  { key: 'travel', pt: 'Viagem & Lugares', en: 'Travel & Places' },
  { key: 'activities', pt: 'Atividades', en: 'Activities' },
  { key: 'objects', pt: 'Objetos', en: 'Objects' },
  { key: 'symbols', pt: 'Símbolos', en: 'Symbols' },
  { key: 'flags', pt: 'Bandeiras', en: 'Flags' },
]

// [emoji, nameEN, namePT, category, version, skinTones]
// skinTones: true if this emoji supports skin tone modifiers
const EMOJI_DATA = [
  ['😀', 'Grinning Face', 'Rosto Sorridente', 'smileys', '6.1', false],
  ['😃', 'Grinning Face with Smiling Eyes', 'Rosto Sorridente com Olhos Sorridentes', 'smileys', '6.0', false],
  ['😄', 'Beaming Face with Smiling Eyes', 'Rosto Radiante com Olhos Sorridentes', 'smileys', '6.0', false],
  ['😁', 'Beaming Face with Smiling Eyes', 'Rosto Radiante', 'smileys', '6.0', false],
  ['😆', 'Grinning Squinting Face', 'Rosto Sorridente de Olhos Meio Fechados', 'smileys', '6.0', false],
  ['😅', 'Grinning Face with Sweat', 'Rosto Sorridente com Suor', 'smileys', '6.0', false],
  ['🤣', 'Rolling on the Floor Laughing', 'Rindo no Chão', 'smileys', '9.0', false],
  ['😂', 'Face with Tears of Joy', 'Rindo de Chorar', 'smileys', '6.0', false],
  ['🙂', 'Slightly Smiling Face', 'Rosto Levemente Sorridente', 'smileys', '7.0', false],
  ['🙃', 'Upside-Down Face', 'Rosto de Cabeça para Baixo', 'smileys', '8.0', false],
  ['😉', 'Winking Face', 'Rosto Piscando', 'smileys', '6.0', false],
  ['😊', 'Smiling Face with Smiling Eyes', 'Rosto Sorridente com Olhos Sorridentes', 'smileys', '6.0', false],
  ['😇', 'Smiling Face with Halo', 'Rosto Sorridente com Aurora', 'smileys', '6.0', false],
  ['🥰', 'Smiling Face with Hearts', 'Rosto Sorridente com Corações', 'smileys', '11.0', false],
  ['😍', 'Smiling Face with Heart-Eyes', 'Rosto com Corações nos Olhos', 'smileys', '6.0', false],
  ['🤩', 'Star-Struck', 'Estrelas nos Olhos', 'smileys', '10.0', false],
  ['😘', 'Face Blowing a Kiss', 'Rosto Mandando Beijo', 'smileys', '6.0', false],
  ['😗', 'Kissing Face', 'Rosto de Beijo', 'smileys', '6.1', false],
  ['😚', 'Kissing Face with Closed Eyes', 'Rosto de Beijo com Olhos Fechados', 'smileys', '6.0', false],
  ['😙', 'Kissing Face with Smiling Eyes', 'Rosto de Beijo com Olhos Sorridentes', 'smileys', '6.1', false],
  ['🥲', 'Smiling Face with Tear', 'Rosto Sorridente com Lágrima', 'smileys', '13.0', false],
  ['😋', 'Face Savoring Food', 'Rosto saboreando Comida', 'smileys', '6.0', false],
  ['😛', 'Face with Tongue', 'Rosto com Língua', 'smileys', '6.0', false],
  ['😜', 'Winking Face with Tongue', 'Rosto Piscando com Língua', 'smileys', '6.0', false],
  ['🤪', 'Zany Face', 'Rosto Maluco', 'smileys', '10.0', false],
  ['😝', 'Squinting Face with Tongue', 'Rosto de Olhos Meio Fechados com Língua', 'smileys', '6.0', false],
  ['🤑', 'Money-Mouth Face', 'Rosto com Dinheiro na Boca', 'smileys', '8.0', false],
  ['🤗', 'Smiling Face with Open Hands', 'Rosto Sorridente com Mãos Abertas', 'smileys', '8.0', false],
  ['🤭', 'Face with Hand Over Mouth', 'Rosto com Mão sobre a Boca', 'smileys', '10.0', false],
  ['🫢', 'Face with Open Eyes and Hand Over Mouth', 'Rosto com Olhos Abertos e Mão sobre a Boca', 'smileys', '14.0', false],
  ['🤫', 'Shushing Face', 'Rosto Pedindo Silêncio', 'smileys', '10.0', false],
  ['🤔', 'Thinking Face', 'Rosto Pensativo', 'smileys', '8.0', false],
  ['🫡', 'Saluting Face', 'Rosto Fazendo Largada', 'smileys', '14.0', false],
  ['🤐', 'Zipper-Mouth Face', 'Rosto de boca de colher', 'smileys', '8.0', false],
  ['🤨', 'Face with Raised Eyebrow', 'Rosto com Sobrancelha Levantada', 'smileys', '10.0', false],
  ['😐', 'Neutral Face', 'Rosto Neutro', 'smileys', '7.0', false],
  ['😑', 'Expressionless Face', 'Rosto Sem Expressão', 'smileys', '6.1', false],
  ['😶', 'Face Without Mouth', 'Rosto sem Boca', 'smileys', '6.0', false],
  ['🫥', 'Dotted Line Face', 'Rosto com Linha Tracejada', 'smileys', '14.0', false],
  ['😏', 'Smirking Face', 'Rosto de Sorriso Maroto', 'smileys', '6.0', false],
  ['😒', 'Unamused Face', 'Rosto Entediado', 'smileys', '6.0', false],
  ['🙄', 'Face with Rolling Eyes', 'Rosto com Olhos Virando', 'smileys', '8.0', false],
  ['😬', 'Grimacing Face', 'Rosto Fazendo Bico', 'smileys', '6.1', false],
  ['🤥', 'Lying Face', 'Rosto de Mentiroso', 'smileys', '9.0', false],
  ['🫠', 'Melting Face', 'Rosto Derretendo', 'smileys', '14.0', false],
  ['😌', 'Relieved Face', 'Rosto Aliviado', 'smileys', '6.0', false],
  ['😔', 'Pensive Face', 'Rosto Pensativo (Triste)', 'smileys', '6.0', false],
  ['😪', 'Sleepy Face', 'Rosto Sonolento', 'smileys', '6.0', false],
  ['🤤', 'Drooling Face', 'Rosto Babando', 'smileys', '9.0', false],
  ['😴', 'Sleeping Face', 'Rosto Dormindo', 'smileys', '6.1', false],
  ['😷', 'Face with Medical Mask', 'Rosto com Máscara', 'smileys', '6.0', false],
  ['🤒', 'Face with Thermometer', 'Rosto com Termômetro', 'smileys', '8.0', false],
  ['🤕', 'Face with Head-Bandage', 'Rosto com Atadura', 'smileys', '8.0', false],
  ['🤢', 'Nauseated Face', 'Rosto Enjoado', 'smileys', '9.0', false],
  ['🤮', 'Face Vomiting', 'Rosto Vomitando', 'smileys', '10.0', false],
  ['🥵', 'Hot Face', 'Rosto Quente', 'smileys', '11.0', false],
  ['🥶', 'Cold Face', 'Rosto Frio', 'smileys', '11.0', false],
  ['🥴', 'Woozy Face', 'Rosto Tonto', 'smileys', '11.0', false],
  ['😵', 'Face with Crossed-Out Eyes', 'Rosto com Olhos Riscados', 'smileys', '6.0', false],
  ['🤯', 'Exploding Head', 'Cabeça Explodindo', 'smileys', '10.0', false],
  ['🥳', 'Partying Face', 'Rosto Festeiro', 'smileys', '11.0', false],
  ['🥸', 'Disguised Face', 'Rosto Disfarçado', 'smileys', '13.0', false],
  ['😎', 'Smiling Face with Sunglasses', 'Rosto com Óculos de Sol', 'smileys', '6.0', false],
  ['🤓', 'Nerd Face', 'Rosto Nerd', 'smileys', '8.0', false],
  ['🧐', 'Face with Monocle', 'Rosto com Monóculo', 'smileys', '10.0', false],
  ['😕', 'Confused Face', 'Rosto Confuso', 'smileys', '6.1', false],
  ['🫤', 'Face with Diagonal Mouth', 'Rosto com Boca Diagonal', 'smileys', '14.0', false],
  ['😟', 'Worried Face', 'Rosto Preocupado', 'smileys', '6.1', false],
  ['🙁', 'Slightly Frowning Face', 'Rosto Levemente Franzido', 'smileys', '7.0', false],
  ['☹️', 'Frowning Face', 'Rosto Franziido', 'smileys', '7.0', false],
  ['😮', 'Face with Open Mouth', 'Rosto com Boca Aberta', 'smileys', '6.1', false],
  ['😯', 'Hushed Face', 'Rosto Surpreso', 'smileys', '6.1', false],
  ['😲', 'Astonished Face', 'Rosto Espantado', 'smileys', '6.0', false],
  ['😳', 'Flushed Face', 'Rosto Corado', 'smileys', '6.0', false],
  ['🥺', 'Pleading Face', 'Rosto Suplicante', 'smileys', '11.0', false],
  ['🥹', 'Face Holding Back Tears', 'Rosto Segurando Lágrimas', 'smileys', '14.0', false],
  ['😦', 'Frowning Face with Open Mouth', 'Rosto Franziido com Boca Aberta', 'smileys', '6.1', false],
  ['😧', 'Anguished Face', 'Rosto Angustiado', 'smileys', '6.1', false],
  ['😨', 'Fearful Face', 'Rosto Amedrontado', 'smileys', '6.0', false],
  ['😰', 'Anxious Face with Sweat', 'Rosto Ansioso com Suor', 'smileys', '6.0', false],
  ['😥', 'Sad but Relieved Face', 'Rosto Triste mas Aliviado', 'smileys', '6.0', false],
  ['😢', 'Crying Face', 'Rosto Chorando', 'smileys', '6.0', false],
  ['😭', 'Loudly Crying Face', 'Rosto Chorando Alto', 'smileys', '6.0', false],
  ['😱', 'Face Screaming in Fear', 'Rosto Gritando de Medo', 'smileys', '6.0', false],
  ['😖', 'Confounded Face', 'Rosto Atordoado', 'smileys', '6.0', false],
  ['😣', 'Persevering Face', 'Rosto Perseverante', 'smileys', '6.0', false],
  ['😞', 'Disappointed Face', 'Rosto Decepcionado', 'smileys', '6.0', false],
  ['😓', 'Downcast Face with Sweat', 'Rosto Abaixado com Suor', 'smileys', '6.0', false],
  ['😩', 'Weary Face', 'Rosto Cansado', 'smileys', '6.0', false],
  ['😫', 'Tired Face', 'Rosto Exausto', 'smileys', '6.0', false],
  ['🥱', 'Yawning Face', 'Rosto Bocejando', 'smileys', '12.0', false],
  ['😤', 'Face with Steam From Nose', 'Rosto Soltando Vapor', 'smileys', '6.0', false],
  ['😡', 'Pouting Face', 'Rosto Raivoso', 'smileys', '6.0', false],
  ['😠', 'Angry Face', 'Rosto Irritado', 'smileys', '6.0', false],
  ['🤬', 'Face with Symbols on Mouth', 'Rosto com Símbolos na Boca', 'smileys', '10.0', false],
  ['😈', 'Smiling Face with Horns', 'Rosto Sorridente com Chifres', 'smileys', '6.0', false],
  ['👿', 'Angry Face with Horns', 'Rosto Raivoso com Chifres', 'smileys', '6.0', false],
  ['💀', 'Skull', 'Caveira', 'smileys', '6.0', false],
  ['☠️', 'Skull and Crossbones', 'Caveira e Ossos', 'smileys', '1.0', false],
  ['💩', 'Pile of Poo', 'Cocô', 'smileys', '6.0', false],
  ['🤡', 'Clown Face', 'Rosto de Palhaço', 'smileys', '9.0', false],
  ['👹', 'Ogre', 'Ogro', 'smileys', '6.0', false],
  ['👺', 'Goblin', 'Duende', 'smileys', '6.0', false],
  ['👻', 'Ghost', 'Fantasma', 'smileys', '6.0', false],
  ['👽', 'Alien', 'Alienígena', 'smileys', '6.0', false],
  ['👾', 'Alien Monster', 'Monstro Alienígena', 'smileys', '6.0', false],
  ['🤖', 'Robot', 'Robô', 'smileys', '8.0', false],
  ['❤️', 'Red Heart', 'Coração Vermelho', 'symbols', '1.0', false],
  ['🧡', 'Orange Heart', 'Coração Laranja', 'symbols', '10.0', false],
  ['💛', 'Yellow Heart', 'Coração Amarelo', 'symbols', '6.0', false],
  ['💚', 'Green Heart', 'Coração Verde', 'symbols', '6.0', false],
  ['💙', 'Blue Heart', 'Coração Azul', 'symbols', '6.0', false],
  ['💜', 'Purple Heart', 'Coração Roxo', 'symbols', '6.0', false],
  ['🖤', 'Black Heart', 'Coração Preto', 'symbols', '9.0', false],
  ['🤍', 'White Heart', 'Coração Branco', 'symbols', '12.0', false],
  ['🤎', 'Brown Heart', 'Coração Marrom', 'symbols', '12.0', false],
  ['💔', 'Broken Heart', 'Coração Partido', 'symbols', '6.0', false],
  ['❣️', 'Heart Exclamation', 'Exclamação de Coração', 'symbols', '1.0', false],
  ['💕', 'Two Hearts', 'Dois Corações', 'symbols', '1.0', false],
  ['💞', 'Revolving Hearts', 'Corações Girando', 'symbols', '6.0', false],
  ['💓', 'Beating Heart', 'Coração Batendo', 'symbols', '6.0', false],
  ['💗', 'Growing Heart', 'Coração Crescendo', 'symbols', '6.0', false],
  ['💖', 'Sparkling Heart', 'Coração Brilhante', 'symbols', '6.0', false],
  ['💘', 'Heart with Arrow', 'Coração com Flecha', 'symbols', '6.0', false],
  ['💝', 'Heart with Ribbon', 'Coração com Fita', 'symbols', '6.0', false],
  ['⭐', 'Star', 'Estrela', 'symbols', '5.1', false],
  ['🌟', 'Glowing Star', 'Estrela Brilhante', 'symbols', '6.0', false],
  ['✨', 'Sparkles', 'Brilhos', 'symbols', '6.0', false],
  ['⚡', 'High Voltage', 'Alta Tensão', 'symbols', '4.0', false],
  ['🔥', 'Fire', 'Fogo', 'symbols', '6.0', false],
  ['💯', 'Hundred Points', '100 Pontos', 'symbols', '6.0', false],
  ['✅', 'Check Mark Button', 'Marca de Confirmação', 'symbols', '6.0', false],
  ['❌', 'Cross Mark', 'Marca X', 'symbols', '6.0', false],
  ['❎', 'Cross Mark Button', 'Botão X', 'symbols', '6.0', false],
  ['❓', 'Red Question Mark', 'Ponto de Interrogação Vermelho', 'symbols', '6.0', false],
  ['❗', 'Red Exclamation Mark', 'Ponto de Exclamação Vermelho', 'symbols', '5.2', false],
  ['‼️', 'Double Exclamation Mark', 'Ponto de Exclamação Duplo', 'symbols', '1.1', false],
  ['⁉️', 'Exclamation Question Mark', 'Ponto de Interrogação e Exclamação', 'symbols', '3.0', false],
  ['🔴', 'Red Circle', 'Círculo Vermelho', 'symbols', '6.0', false],
  ['🟠', 'Orange Circle', 'Círculo Laranja', 'symbols', '12.0', false],
  ['🟡', 'Yellow Circle', 'Círculo Amarelo', 'symbols', '12.0', false],
  ['🟢', 'Green Circle', 'Círculo Verde', 'symbols', '12.0', false],
  ['🔵', 'Blue Circle', 'Círculo Azul', 'symbols', '6.0', false],
  ['🟣', 'Purple Circle', 'Círculo Roxo', 'symbols', '12.0', false],
  ['⚫', 'Black Circle', 'Círculo Preto', 'symbols', '4.1', false],
  ['⚪', 'White Circle', 'Círculo Branco', 'symbols', '4.1', false],
  ['🟤', 'Brown Circle', 'Círculo Marrom', 'symbols', '12.0', false],
  ['🟥', 'Red Square', 'Quadrado Vermelho', 'symbols', '12.0', false],
  ['🟧', 'Orange Square', 'Quadrado Laranja', 'symbols', '12.0', false],
  ['🟨', 'Yellow Square', 'Quadrado Amarelo', 'symbols', '12.0', false],
  ['🟩', 'Green Square', 'Quadrado Verde', 'symbols', '12.0', false],
  ['🟦', 'Blue Square', 'Quadrado Azul', 'symbols', '12.0', false],
  ['🟪', 'Purple Square', 'Quadrado Roxo', 'symbols', '12.0', false],
  ['⬛', 'Black Large Square', 'Quadrado Grande Preto', 'symbols', '5.1', false],
  ['⬜', 'White Large Square', 'Quadrado Grande Branco', 'symbols', '5.2', false],
  ['🟫', 'Brown Square', 'Quadrado Marrom', 'symbols', '12.0', false],
  ['🔶', 'Large Orange Diamond', 'Diamante Grande Laranja', 'symbols', '6.0', false],
  ['🔷', 'Large Blue Diamond', 'Diamante Grande Azul', 'symbols', '6.0', false],
  ['🔸', 'Small Orange Diamond', 'Diamante Pequeno Laranja', 'symbols', '6.0', false],
  ['🔹', 'Small Blue Diamond', 'Diamante Pequeno Azul', 'symbols', '6.0', false],
  ['🔺', 'Red Triangle Pointed Up', 'Triângulo Vermelho para Cima', 'symbols', '6.0', false],
  ['🔻', 'Red Triangle Pointed Down', 'Triângulo Vermelho para Baixo', 'symbols', '6.0', false],
  ['🚩', 'Red Flag', 'Bandeira Vermelha', 'objects', '6.0', false],
  ['🏳️', 'White Flag', 'Bandeira Branca', 'objects', '7.0', false],
  ['🏴', 'Black Flag', 'Bandeira Preta', 'objects', '7.0', false],
  ['🏁', 'Chequered Flag', 'Bandeira Xadrez', 'objects', '6.0', false],
  ['🏳️‍🌈', 'Rainbow Flag', 'Bandeira Arco-Íris', 'objects', '10.0', false],
  ['🏳️‍⚧️', 'Transgender Flag', 'Bandeira Transgênero', 'objects', '13.0', false],
  ['🏴‍☠️', 'Pirate Flag', 'Bandeira Pirata', 'objects', '11.0', false],
  ['🇺🇸', 'Flag: United States', 'Bandeira: Estados Unidos', 'flags', '6.0', false],
  ['🇬🇧', 'Flag: United Kingdom', 'Bandeira: Reino Unido', 'flags', '6.0', false],
  ['🇧🇷', 'Flag: Brazil', 'Bandeira: Brasil', 'flags', '6.0', false],
  ['🇩🇪', 'Flag: Germany', 'Bandeira: Alemanha', 'flags', '6.0', false],
  ['🇫🇷', 'Flag: France', 'Bandeira: França', 'flags', '6.0', false],
  ['🇯🇵', 'Flag: Japan', 'Bandeira: Japão', 'flags', '6.0', false],
  ['🇰🇷', 'Flag: South Korea', 'Bandeira: Coreia do Sul', 'flags', '6.0', false],
  ['🇨🇳', 'Flag: China', 'Bandeira: China', 'flags', '6.0', false],
  ['🇮🇳', 'Flag: India', 'Bandeira: Índia', 'flags', '6.0', false],
  ['🇷🇺', 'Flag: Russia', 'Bandeira: Rússia', 'flags', '6.0', false],
  ['🇨🇦', 'Flag: Canada', 'Bandeira: Canadá', 'flags', '6.0', false],
  ['🇦🇺', 'Flag: Australia', 'Bandeira: Austrália', 'flags', '6.0', false],
  ['🇨🇦', 'Flag: Canada', 'Bandeira: Canadá', 'flags', '6.0', false],
  ['🇦🇷', 'Flag: Argentina', 'Bandeira: Argentina', 'flags', '6.0', false],
  ['🇲🇽', 'Flag: Mexico', 'Bandeira: México', 'flags', '6.0', false],
  ['🇪🇸', 'Flag: Spain', 'Bandeira: Espanha', 'flags', '6.0', false],
  ['🇮🇹', 'Flag: Italy', 'Bandeira: Itália', 'flags', '6.0', false],
  ['🇵🇹', 'Flag: Portugal', 'Bandeira: Portugal', 'flags', '6.0', false],
  ['🇳🇱', 'Flag: Netherlands', 'Bandeira: Holanda', 'flags', '6.0', false],
  ['🇸🇪', 'Flag: Sweden', 'Bandeira: Suécia', 'flags', '6.0', false],
  ['🇨🇭', 'Flag: Switzerland', 'Bandeira: Suíça', 'flags', '6.0', false],
  ['🇰🇪', 'Flag: Kenya', 'Bandeira: Quênia', 'flags', '6.0', false],
  ['🇿🇦', 'Flag: South Africa', 'Bandeira: África do Sul', 'flags', '6.0', false],
  ['🇳🇬', 'Flag: Nigeria', 'Bandeira: Nigéria', 'flags', '6.0', false],
  ['🇪🇬', 'Flag: Egypt', 'Bandeira: Egito', 'flags', '6.0', false],
  ['🇸🇦', 'Flag: Saudi Arabia', 'Bandeira: Arábia Saudita', 'flags', '6.0', false],
  ['🇦🇪', 'Flag: United Arab Emirates', 'Bandeira: Emirados Árabes', 'flags', '6.0', false],
  ['🇹🇷', 'Flag: Turkey', 'Bandeira: Turquia', 'flags', '6.0', false],
  ['🇮🇱', 'Flag: Israel', 'Bandeira: Israel', 'flags', '6.0', false],
  ['🇺🇦', 'Flag: Ukraine', 'Bandeira: Ucrânia', 'flags', '6.0', false],
  ['🇵🇱', 'Flag: Poland', 'Bandeira: Polônia', 'flags', '6.0', false],
  ['🇨🇱', 'Flag: Chile', 'Bandeira: Chile', 'flags', '6.0', false],
  ['🇨🇴', 'Flag: Colombia', 'Bandeira: Colômbia', 'flags', '6.0', false],
  ['🇵🇪', 'Flag: Peru', 'Bandeira: Peru', 'flags', '6.0', false],
  ['🇻🇪', 'Flag: Venezuela', 'Bandeira: Venezuela', 'flags', '6.0', false],
  ['🇨🇺', 'Flag: Cuba', 'Bandeira: Cuba', 'flags', '6.0', false],
  ['🇯🇲', 'Flag: Jamaica', 'Bandeira: Jamaica', 'flags', '6.0', false],
  ['🇵🇭', 'Flag: Philippines', 'Bandeira: Filipinas', 'flags', '6.0', false],
  ['🇹🇭', 'Flag: Thailand', 'Bandeira: Tailândia', 'flags', '6.0', false],
  ['🇻🇳', 'Flag: Vietnam', 'Bandeira: Vietnã', 'flags', '6.0', false],
  ['🇮🇩', 'Flag: Indonesia', 'Bandeira: Indonésia', 'flags', '6.0', false],
  ['🇳🇿', 'Flag: New Zealand', 'Bandeira: Nova Zelândia', 'flags', '6.0', false],
  ['🇸🇬', 'Flag: Singapore', 'Bandeira: Singapura', 'flags', '6.0', false],
  ['🇲🇾', 'Flag: Malaysia', 'Bandeira: Malásia', 'flags', '6.0', false],
  ['🇰🇵', 'Flag: North Korea', 'Bandeira: Coreia do Norte', 'flags', '6.0', false],
  // ── Animais & Natureza ────────────────────────────────────────────
  ['🐶', 'Dog Face', 'Rosto de Cachorro', 'animals', '6.0', false],
  ['🐱', 'Cat Face', 'Rosto de Gato', 'animals', '6.0', false],
  ['🐭', 'Mouse Face', 'Rosto de Rato', 'animals', '6.0', false],
  ['🐹', 'Hamster', 'Hamster', 'animals', '6.0', false],
  ['🐰', 'Rabbit Face', 'Rosto de Coelho', 'animals', '6.0', false],
  ['🦊', 'Fox', 'Raposa', 'animals', '9.0', false],
  ['🐻', 'Bear', 'Urso', 'animals', '6.0', false],
  ['🐼', 'Panda', 'Panda', 'animals', '6.0', false],
  ['🐨', 'Koala', 'Coala', 'animals', '6.0', false],
  ['🐯', 'Tiger Face', 'Rosto de Tigre', 'animals', '6.0', false],
  ['🦁', 'Lion', 'Leão', 'animals', '8.0', false],
  ['🐮', 'Cow Face', 'Rosto de Vaca', 'animals', '6.0', false],
  ['🐷', 'Pig Face', 'Rosto de Porco', 'animals', '6.0', false],
  ['🐸', 'Frog', 'Sapo', 'animals', '6.0', false],
  ['🐵', 'Monkey Face', 'Rosto de Macaco', 'animals', '6.0', false],
  ['🙈', 'See-No-Evil Monkey', 'Macaco Não Ver', 'animals', '6.0', false],
  ['🙉', 'Hear-No-Evil Monkey', 'Macaco Não Ouvir', 'animals', '6.0', false],
  ['🙊', 'Speak-No-Evil Monkey', 'Macaco Não Falar', 'animals', '6.0', false],
  ['🐔', 'Chicken', 'Galinha', 'animals', '6.0', false],
  ['🐧', 'Penguin', 'Pinguim', 'animals', '6.0', false],
  ['🐦', 'Bird', 'Pássaro', 'animals', '6.0', false],
  ['🐤', 'Baby Chick', 'Pintinho', 'animals', '6.0', false],
  ['🦆', 'Duck', 'Pato', 'animals', '9.0', false],
  ['🦅', 'Eagle', 'Águia', 'animals', '9.0', false],
  ['🦉', 'Owl', 'Coruja', 'animals', '9.0', false],
  ['🦇', 'Bat', 'Morcego', 'animals', '9.0', false],
  ['🐺', 'Wolf', 'Lobo', 'animals', '6.0', false],
  ['🐗', 'Boar', 'Javali', 'animals', '6.0', false],
  ['🐴', 'Horse Face', 'Rosto de Cavalo', 'animals', '6.0', false],
  ['🦄', 'Unicorn', 'Unicórnio', 'animals', '8.0', false],
  ['🐝', 'Honeybee', 'Abelha', 'animals', '6.0', false],
  ['🐛', 'Bug', 'Inseto', 'animals', '6.0', false],
  ['🦋', 'Butterfly', 'Borboleta', 'animals', '9.0', false],
  ['🐌', 'Snail', 'Caracol', 'animals', '6.0', false],
  ['🐞', 'Lady Beetle', 'Joaninha', 'animals', '6.0', false],
  ['🐜', 'Ant', 'Formiga', 'animals', '6.0', false],
  ['🪲', 'Beetle', 'Besouro', 'animals', '13.0', false],
  ['🐢', 'Turtle', 'Tartaruga', 'animals', '6.0', false],
  ['🐍', 'Snake', 'Cobra', 'animals', '6.0', false],
  ['🦎', 'Lizard', 'Lagarto', 'animals', '9.0', false],
  ['🐙', 'Octopus', 'Polvo', 'animals', '6.0', false],
  ['🦑', 'Squid', 'Lula', 'animals', '9.0', false],
  ['🐠', 'Tropical Fish', 'Peixe Tropical', 'animals', '6.0', false],
  ['🐟', 'Fish', 'Peixe', 'animals', '6.0', false],
  ['🐬', 'Dolphin', 'Golfinho', 'animals', '6.0', false],
  ['🐳', 'Spouting Whale', 'Baleia Borrifando', 'animals', '6.0', false],
  ['🐋', 'Whale', 'Baleia', 'animals', '6.0', false],
  ['🦈', 'Shark', 'Tubarão', 'animals', '9.0', false],
  ['🐊', 'Crocodile', 'Crocodilo', 'animals', '6.0', false],
  ['🐆', 'Leopard', 'Leopardo', 'animals', '6.0', false],
  ['🦓', 'Zebra', 'Zebra', 'animals', '9.0', false],
  ['🦍', 'Gorilla', 'Gorila', 'animals', '9.0', false],
  ['🦧', 'Orangutan', 'Orangotango', 'animals', '12.0', false],
  ['🐘', 'Elephant', 'Elefante', 'animals', '6.0', false],
  ['🦣', 'Mammoth', 'Mamute', 'animals', '13.0', false],
  ['🦛', 'Hippopotamus', 'Hipopótamo', 'animals', '11.0', false],
  ['🦏', 'Rhinoceros', 'Rinoceronte', 'animals', '9.0', false],
  ['🐪', 'Camel', 'Camelo', 'animals', '6.0', false],
  ['🦒', 'Giraffe', 'Girafa', 'animals', '9.0', false],
  ['🦘', 'Kangaroo', 'Canguru', 'animals', '11.0', false],
  ['🦥', 'Sloth', 'Preguiça', 'animals', '11.0', false],
  ['🦦', 'Otter', 'Lontra', 'animals', '11.0', false],
  ['🦫', 'Beaver', 'Castor', 'animals', '13.0', false],
  ['🐱', 'Cat Face', 'Rosto de Gato', 'animals', '6.0', false],
  // ── Comida & Bebida ────────────────────────────────────────────────
  ['🍎', 'Red Apple', 'Maçã Vermelha', 'food', '6.0', false],
  ['🍊', 'Tangerine', 'Tangerina', 'food', '6.0', false],
  ['🍋', 'Lemon', 'Limão', 'food', '6.0', false],
  ['🍌', 'Banana', 'Banana', 'food', '6.0', false],
  ['🍉', 'Watermelon', 'Melancia', 'food', '6.0', false],
  ['🍇', 'Grapes', 'Uvas', 'food', '6.0', false],
  ['🍓', 'Strawberry', 'Morango', 'food', '6.0', false],
  ['🫐', 'Blueberries', 'Mirtilos', 'food', '13.0', false],
  ['🍈', 'Melon', 'Melão', 'food', '6.0', false],
  ['🍒', 'Cherries', 'Cerejas', 'food', '6.0', false],
  ['🍑', 'Peach', 'Pêssego', 'food', '6.0', false],
  ['🥭', 'Mango', 'Manga', 'food', '11.0', false],
  ['🍍', 'Pineapple', 'Abacaxi', 'food', '6.0', false],
  ['🥥', 'Coconut', 'Coco', 'food', '10.0', false],
  ['🥝', 'Kiwi Fruit', 'Kiwi', 'food', '9.0', false],
  ['🍅', 'Tomato', 'Tomate', 'food', '6.0', false],
  ['🥑', 'Avocado', 'Abacate', 'food', '9.0', false],
  ['🍆', 'Eggplant', 'Berinjela', 'food', '6.0', false],
  ['🥔', 'Potato', 'Batata', 'food', '9.0', false],
  ['🥕', 'Carrot', 'Cenoura', 'food', '9.0', false],
  ['🌽', 'Ear of Milho', 'Espiga de Milho', 'food', '6.0', false],
  ['🌶️', 'Hot Pepper', 'Pimenta', 'food', '7.0', false],
  ['🫑', 'Bell Pepper', 'Pimentão', 'food', '13.0', false],
  ['🥒', 'Cucumber', 'Pepino', 'food', '9.0', false],
  ['🥬', 'Leafy Green', 'Verdes Folhosos', 'food', '11.0', false],
  ['🥦', 'Broccoli', 'Brócolis', 'food', '10.0', false],
  ['🧄', 'Garlic', 'Alho', 'food', '12.0', false],
  ['🧅', 'Onion', 'Cebola', 'food', '12.0', false],
  ['🍞', 'Bread', 'Pão', 'food', '6.0', false],
  ['🥐', 'Croissant', 'Croissant', 'food', '10.0', false],
  ['🥖', 'Baguette Bread', 'Pão Francês', 'food', '10.0', false],
  ['🫓', 'Flatbread', 'Pão Sírio', 'food', '13.0', false],
  ['🥨', 'Pretzel', 'Pretzel', 'food', '10.0', false],
  ['🧀', 'Cheese Wedge', 'Queijo', 'food', '8.0', false],
  ['🥚', 'Egg', 'Ovo', 'food', '9.0', false],
  ['🍳', 'Cooking', 'Ovo Frito', 'food', '6.0', false],
  ['🧈', 'Butter', 'Manteiga', 'food', '12.0', false],
  ['🥞', 'Pancakes', 'Panquecas', 'food', '10.0', false],
  ['🧇', 'Waffle', 'Waffle', 'food', '12.0', false],
  ['🥓', 'Bacon', 'Bacon', 'food', '9.0', false],
  ['🥩', 'Cut of Meat', 'Pedaço de Carne', 'food', '9.0', false],
  ['🍗', 'Poultry Leg', 'Coxa de Frango', 'food', '6.0', false],
  ['🍖', 'Meat on Bone', 'Carne no Osso', 'food', '6.0', false],
  ['🌭', 'Hot Dog', 'Cachorro-Quente', 'food', '8.0', false],
  ['🍔', 'Hamburger', 'Hambúrguer', 'food', '6.0', false],
  ['🍟', 'French Fries', 'Batata Frita', 'food', '6.0', false],
  ['🍕', 'Pizza', 'Pizza', 'food', '6.0', false],
  ['🥪', 'Sandwich', 'Sanduíche', 'food', '10.0', false],
  ['🌮', 'Taco', 'Taco', 'food', '8.0', false],
  ['🌯', 'Burrito', 'Burrito', 'food', '8.0', false],
  ['🫔', 'Tamale', 'Tamale', 'food', '13.0', false],
  ['🥙', 'Stuffed Flatbread', 'Pão Recheado', 'food', '9.0', false],
  ['🧆', 'Falafel', 'Falafel', 'food', '12.0', false],
  ['🥗', 'Green Salad', 'Salada Verde', 'food', '9.0', false],
  ['🍿', 'Popcorn', 'Pipoca', 'food', '8.0', false],
  ['🧂', 'Salt', 'Sal', 'food', '11.0', false],
  ['🥫', 'Canned Food', 'Comida Enlatada', 'food', '12.0', false],
  ['🍱', 'Bento Box', 'Bento', 'food', '6.0', false],
  ['🍘', 'Rice Cracker', 'Biscoito de Arroz', 'food', '6.0', false],
  ['🍙', 'Rice Ball', 'Onigiri', 'food', '6.0', false],
  ['🍚', 'Cooked Rice', 'Arroz Cozido', 'food', '6.0', false],
  ['🍛', 'Curry Rice', 'Arroz com Curry', 'food', '6.0', false],
  ['🍜', 'Steaming Bowl', 'Tigela Fumegante', 'food', '6.0', false],
  ['🍝', 'Spaghetti', 'Espaguete', 'food', '6.0', false],
  ['🍠', 'Roasted Sweet Potato', 'Batata-Doce Assada', 'food', '6.0', false],
  ['🍢', 'Oden', 'Oden', 'food', '6.0', false],
  ['🍣', 'Sushi', 'Sushi', 'food', '6.0', false],
  ['🍤', 'Fried Shrimp', 'Camarão Frito', 'food', '6.0', false],
  ['🍥', 'Fish Cake with Swirl', 'Narutomaki', 'food', '6.0', false],
  ['🥮', 'Moon Cake', 'Moon Cake', 'food', '11.0', false],
  ['🍡', 'Dango', 'Dango', 'food', '6.0', false],
  ['🥟', 'Dumpling', 'Bolinho Chinês', 'food', '10.0', false],
  ['🥠', 'Fortune Cookie', 'Biscoito da Sorte', 'food', '10.0', false],
  ['🥡', 'Takeout Box', 'Caixa de Comida', 'food', '10.0', false],
  ['🦀', 'Crab', 'Caranguejo', 'food', '9.0', false],
  ['🦞', 'Lobster', 'Lagosta', 'food', '11.0', false],
  ['🦐', 'Shrimp', 'Camarão', 'food', '9.0', false],
  ['🦑', 'Squid', 'Lula', 'food', '9.0', false],
  ['🍦', 'Soft Ice Cream', 'Sorvete', 'food', '6.0', false],
  ['🍧', 'Shaved Ice', 'Gelo raspado', 'food', '6.0', false],
  ['🍨', 'Ice Cream', 'Sorvete em Tigela', 'food', '6.0', false],
  ['🍩', 'Doughnut', 'Rosquinha', 'food', '6.0', false],
  ['🍪', 'Cookie', 'Biscoito', 'food', '6.0', false],
  ['🎂', 'Birthday Cake', 'Bolo de Aniversário', 'food', '6.0', false],
  ['🍰', 'Shortcake', 'Bolo de Morango', 'food', '6.0', false],
  ['🧁', 'Cupcake', 'Cupcake', 'food', '11.0', false],
  ['🥧', 'Pie', 'Torta', 'food', '11.0', false],
  ['🍫', 'Chocolate Bar', 'Barra de Chocolate', 'food', '6.0', false],
  ['🍬', 'Candy', 'Balas', 'food', '6.0', false],
  ['🍭', 'Lollipop', 'Pirulito', 'food', '6.0', false],
  ['🍮', 'Custard', 'Pudim', 'food', '6.0', false],
  ['☕', 'Coffee', 'Café', 'objects', '4.0', false],
  ['🍵', 'Teacup Without Handle', 'Xícara de Chá', 'food', '6.0', false],
  ['🧃', 'Beverage Box', 'Caixa de Sucos', 'food', '12.0', false],
  ['🥤', 'Cup with Straw', 'Copo com Canudo', 'food', '10.0', false],
  ['🧋', 'Bubble Tea', 'Bobá', 'food', '13.0', false],
  ['🍶', 'Sake', 'Sakê', 'food', '6.0', false],
  ['🍺', 'Beer Mug', 'Caneca de Cerveja', 'food', '6.0', false],
  ['🍻', 'Clinking Beer Mugs', 'Canecas Brindando', 'food', '6.0', false],
  ['🥂', 'Clinking Glasses', 'Copos Brindando', 'food', '9.0', false],
  ['🍷', 'Wine Glass', 'Taça de Vinho', 'food', '6.0', false],
  ['🍸', 'Cocktail Glass', 'Copa de Coquetel', 'food', '6.0', false],
  ['🍹', 'Tropical Drink', 'Drink Tropical', 'food', '6.0', false],
  ['🧉', 'Mate', 'Chimarrão', 'food', '12.0', false],
  ['🍾', 'Bottle with Popping Cork', 'Garrafa com Espumante', 'food', '7.0', false],
  // ── Viagem & Lugares ────────────────────────────────────────────────
  ['🚗', 'Automobile', 'Carro', 'travel', '6.0', false],
  ['🚕', 'Taxi', 'Táxi', 'travel', '6.0', false],
  ['🚌', 'Bus', 'Ônibus', 'travel', '6.0', false],
  ['🏎️', 'Racing Car', 'Carro de Corrida', 'travel', '7.0', false],
  ['🚓', 'Police Car', 'Carro de Polícia', 'travel', '6.0', false],
  ['🚑', 'Ambulance', 'Ambulância', 'travel', '6.0', false],
  ['🚒', 'Fire Engine', 'Caminhão de Bombeiros', 'travel', '6.0', false],
  ['🚐', 'Minibus', 'Micro-ônibus', 'travel', '6.0', false],
  ['🚚', 'Delivery Truck', 'Caminhão', 'travel', '6.0', false],
  ['🚛', 'Articulated Truck', 'Caminhão Grande', 'travel', '6.0', false],
  ['🚜', 'Tractor', 'Trator', 'travel', '6.0', false],
  ['🚲', 'Bicycle', 'Bicicleta', 'travel', '6.0', false],
  ['🛵', 'Motor Scooter', 'Motocicleta', 'travel', '9.0', false],
  ['🏍️', 'Motorcycle', 'Moto', 'travel', '7.0', false],
  ['✈️', 'Airplane', 'Avião', 'travel', '1.1', false],
  ['🚀', 'Rocket', 'Foguete', 'travel', '6.0', false],
  ['🛸', 'Flying Saucer', 'Ovni', 'travel', '10.0', false],
  ['🚁', 'Helicopter', 'Helicóptero', 'travel', '6.0', false],
  ['⛵', 'Sailboat', 'Veleiro', 'travel', '5.2', false],
  ['🚤', 'Speedboat', 'Lancha', 'travel', '6.0', false],
  ['🛳️', 'Passenger Ship', 'Navio de Passageiros', 'travel', '7.0', false],
  ['⛴️', 'Ferry', 'Balsa', 'travel', '5.1', false],
  ['🚢', 'Ship', 'Navio', 'travel', '6.0', false],
  ['🏠', 'House', 'Casa', 'travel', '6.0', false],
  ['🏡', 'House with Garden', 'Casa com Jardim', 'travel', '6.0', false],
  ['🏢', 'Office Building', 'Prédio de Escritório', 'travel', '6.0', false],
  ['🏣', 'Japanese Post Office', 'Correios do Japão', 'travel', '6.0', false],
  ['🏥', 'Hospital', 'Hospital', 'travel', '6.0', false],
  ['🏦', 'Bank', 'Banco', 'travel', '6.0', false],
  ['🏨', 'Hotel', 'Hotel', 'travel', '6.0', false],
  ['🏩', 'Love Hotel', 'Love Hotel', 'travel', '6.0', false],
  ['🏪', 'Convenience Store', 'Loja de Conveniência', 'travel', '6.0', false],
  ['🏫', 'School', 'Escola', 'travel', '6.0', false],
  ['🏬', 'Department Store', 'Loja de Departamento', 'travel', '6.0', false],
  ['🏭', 'Factory', 'Fábrica', 'travel', '6.0', false],
  ['🏯', 'Japanese Castle', 'Castelo Japonês', 'travel', '6.0', false],
  ['🏰', 'Castle', 'Castelo', 'travel', '6.0', false],
  ['💒', 'Wedding', 'Casamento', 'travel', '6.0', false],
  ['🗼', 'Tokyo Tower', 'Torre de Tóquio', 'travel', '6.0', false],
  ['🗽', 'Statue of Liberty', 'Estátua da Liberdade', 'travel', '6.0', false],
  ['⛪', 'Church', 'Igreja', 'travel', '5.2', false],
  ['🕌', 'Mosque', 'Mesquita', 'travel', '8.0', false],
  ['🛕', 'Hindu Temple', 'Templo Hindu', 'travel', '12.0', false],
  ['🕍', 'Synagogue', 'Sinagoga', 'travel', '8.0', false],
  ['⛩️', 'Shinto Shrine', 'Santuário Xintoísta', 'travel', '5.2', false],
  // ── Atividades ────────────────────────────────────────────────────
  ['⚽', 'Soccer Ball', 'Bola de Futebol', 'activities', '5.2', false],
  ['🏀', 'Basketball', 'Basquete', 'activities', '8.0', false],
  ['🏈', 'American Football', 'Futebol Americano', 'activities', '6.0', false],
  ['⚾', 'Baseball', 'Beisebol', 'activities', '5.2', false],
  ['🥎', 'Softball', 'Softbol', 'activities', '11.0', false],
  ['🎾', 'Tennis', 'Tênis', 'activities', '6.0', false],
  ['🏐', 'Volleyball', 'Vôlei', 'activities', '8.0', false],
  ['🏉', 'Rugby Football', 'Rugby', 'activities', '6.0', false],
  ['🥏', 'Flying Disc', 'Frisbee', 'activities', '11.0', false],
  ['🎳', 'Bowling', 'Boliche', 'activities', '6.0', false],
  ['🏏', 'Cricket Game', 'Críquete', 'activities', '8.0', false],
  ['🏑', 'Field Hockey', 'Hóquei de Campo', 'activities', '8.0', false],
  ['🏒', 'Ice Hockey', 'Hóquei no Gelo', 'activities', '8.0', false],
  ['🥍', 'Lacrosse', 'Lacrosse', 'activities', '11.0', false],
  ['🏓', 'Ping Pong', 'Tênis de Mesa', 'activities', '8.0', false],
  ['🏸', 'Badminton', 'Badminton', 'activities', '8.0', false],
  ['🥊', 'Boxing Glove', 'Luva de Boxe', 'activities', '9.0', false],
  ['🥋', 'Martial Arts Uniform', 'Quimono', 'activities', '9.0', false],
  ['🥅', 'Goal Net', 'Rede de Gol', 'activities', '9.0', false],
  ['⛳', 'Flag in Hole', 'Bandeira no Buraco', 'activities', '5.2', false],
  ['⛸️', 'Ice Skate', 'Patins no Gelo', 'activities', '5.2', false],
  ['🎣', 'Fishing Pole', 'Vara de Pesca', 'activities', '6.0', false],
  ['🤿', 'Diving Mask', 'Máscara de Mergulho', 'activities', '11.0', false],
  ['🎿', 'Skis', 'Esquis', 'activities', '5.2', false],
  ['🛷', 'Sled', 'Trenó', 'activities', '11.0', false],
  ['🥌', 'Curling Stone', 'Pedra de Curling', 'activities', '10.0', false],
  ['🎯', 'Bullseye', 'Dardo', 'activities', '6.0', false],
  ['🪀', 'Yo-Yo', 'Ioiô', 'activities', '12.0', false],
  ['🪁', 'Kite', 'Pipa', 'activities', '12.0', false],
  ['🎮', 'Video Game', 'Video Game', 'activities', '6.0', false],
  ['🕹️', 'Joystick', 'Joystick', 'activities', '7.0', false],
  ['🎲', 'Game Die', 'Dado', 'activities', '6.0', false],
  ['🧩', 'Puzzle Piece', 'Peça de Quebra-Cabeça', 'activities', '11.0', false],
  ['♟️', 'Chess Pawn', 'Peão de Xadrez', 'activities', '11.0', false],
  ['🎭', 'Performing Arts', 'Artes Cênicas', 'activities', '6.0', false],
  ['🎨', 'Artist Palette', 'Paleta de Pintor', 'activities', '6.0', false],
  ['🎬', 'Clapper Board', 'Clapperboard', 'activities', '6.0', false],
  ['🎤', 'Microphone', 'Microfone', 'activities', '6.0', false],
  ['🎧', 'Headphone', 'Fone de Ouvido', 'activities', '6.0', false],
  ['🎼', 'Musical Score', 'Partitura', 'activities', '5.1', false],
  ['🎹', 'Musical Keyboard', 'Teclado Musical', 'activities', '6.0', false],
  ['🥁', 'Drum', 'Bateria', 'activities', '9.0', false],
  ['🎷', 'Saxophone', 'Saxofone', 'activities', '6.0', false],
  ['🎺', 'Trumpet', 'Trompete', 'activities', '6.0', false],
  ['🎸', 'Guitar', 'Violão', 'activities', '6.0', false],
  ['🪕', 'Banjo', 'Banjo', 'activities', '12.0', false],
  ['🎻', 'Violin', 'Violino', 'activities', '6.0', false],
  ['🎪', 'Circus Tent', 'Lona de Circo', 'activities', '6.0', false],
  // ── Objetos ────────────────────────────────────────────────────────
  ['⌚', 'Watch', 'Relógio', 'objects', '1.1', false],
  ['📱', 'Mobile Phone', 'Celular', 'objects', '6.0', false],
  ['💻', 'Laptop', 'Notebook', 'objects', '6.0', false],
  ['⌨️', 'Keyboard', 'Teclado', 'objects', '7.0', false],
  ['🖥️', 'Desktop Computer', 'Computador', 'objects', '7.0', false],
  ['🖨️', 'Printer', 'Impressora', 'objects', '7.0', false],
  ['🖱️', 'Computer Mouse', 'Mouse', 'objects', '7.0', false],
  ['🖲️', 'Trackball', 'Trackball', 'objects', '7.0', false],
  ['💾', 'Floppy Disk', 'Disquete', 'objects', '6.0', false],
  ['💿', 'Optical Disc', 'CD', 'objects', '6.0', false],
  ['📀', 'DVD', 'DVD', 'objects', '6.0', false],
  ['📷', 'Camera', 'Câmera', 'objects', '6.0', false],
  ['📸', 'Camera with Flash', 'Câmera com Flash', 'objects', '6.0', false],
  ['📹', 'Video Camera', 'Câmera de Vídeo', 'objects', '6.0', false],
  ['🎥', 'Movie Camera', 'Cinegrafo', 'objects', '6.0', false],
  ['📽️', 'Film Projector', 'Projetor', 'objects', '7.0', false],
  ['🎞️', 'Film Frames', 'Filme', 'objects', '7.0', false],
  ['📺', 'Television', 'Televisão', 'objects', '6.0', false],
  ['📻', 'Radio', 'Rádio', 'objects', '6.0', false],
  ['🎙️', 'Studio Microphone', 'Microfone de Estúdio', 'objects', '7.0', false],
  ['🎚️', 'Level Slider', 'Controle Deslizante', 'objects', '7.0', false],
  ['🎛️', 'Control Knobs', 'Botões de Controle', 'objects', '7.0', false],
  ['🧭', 'Compass', 'Bússola', 'objects', '11.0', false],
  ['⏱️', 'Stopwatch', 'Cronômetro', 'objects', '7.0', false],
  ['⏲️', 'Timer Clock', 'Timer', 'objects', '7.0', false],
  ['⏰', 'Alarm Clock', 'Despertador', 'objects', '6.0', false],
  ['🕰️', 'Mantelpiece Clock', 'Relógio de Mesa', 'objects', '7.0', false],
  ['💡', 'Light Bulb', 'Lâmpada', 'objects', '6.0', false],
  ['🔦', 'Flashlight', 'Lanterna', 'objects', '6.0', false],
  ['🕯️', 'Candle', 'Vela', 'objects', '7.0', false],
  ['💰', 'Money Bag', 'Saco de Dinheiro', 'objects', '6.0', false],
  ['💵', 'Dollar Banknote', 'Cédula de Dólar', 'objects', '6.0', false],
  ['💴', 'Yen Banknote', 'Cédula de Iene', 'objects', '6.0', false],
  ['💶', 'Euro Banknote', 'Cédula de Euro', 'objects', '6.0', false],
  ['💷', 'Pound Banknote', 'Cédula de Libra', 'objects', '6.0', false],
  ['💸', 'Money with Wings', 'Dinheiro Voando', 'objects', '6.0', false],
  ['💳', 'Credit Card', 'Cartão de Crédito', 'objects', '6.0', false],
  ['🧾', 'Receipt', 'Recibo', 'objects', '11.0', false],
  ['💎', 'Gem Stone', 'Joia', 'objects', '6.0', false],
  ['⚖️', 'Balance Scale', 'Balança', 'objects', '9.0', false],
  ['🔧', 'Wrench', 'Chave Inglesa', 'objects', '6.0', false],
  ['🔨', 'Hammer', 'Martelo', 'objects', '6.0', false],
  ['⚒️', 'Hammer and Pick', 'Martelo e Picareta', 'objects', '4.0', false],
  ['🛠️', 'Hammer and Wrench', 'Martelo e Chave Inglesa', 'objects', '7.0', false],
  ['⛏️', 'Pick', 'Picareta', 'objects', '4.0', false],
  ['🪓', 'Axe', 'Machado', 'objects', '12.0', false],
  ['🔩', 'Nut and Bolt', 'Parafuso e Porca', 'objects', '6.0', false],
  ['⚙️', 'Gear', 'Engrenagem', 'objects', '4.1', false],
  ['🗜️', 'Clamp', 'Torno', 'objects', '7.0', false],
  ['🔗', 'Link', 'Link', 'objects', '6.0', false],
  ['⛓️', 'Chains', 'Correntes', 'objects', '6.0', false],
  ['🧲', 'Magnet', 'Imã', 'objects', '11.0', false],
  ['🧪', 'Test Tube', 'Tubo de Ensaio', 'objects', '11.0', false],
  ['🧫', 'Petri Dish', 'Placa de Petri', 'objects', '11.0', false],
  ['🧬', 'DNA', 'DNA', 'objects', '11.0', false],
  ['🔬', 'Microscope', 'Microscópio', 'objects', '6.0', false],
  ['🔭', 'Telescope', 'Telescópio', 'objects', '6.0', false],
  ['📡', 'Satellite Antenna', 'Antena Parabólica', 'objects', '6.0', false],
  ['💊', 'Pill', 'Pílula', 'objects', '6.0', false],
  ['💉', 'Syringe', 'Seringa', 'objects', '6.0', false],
  ['🩸', 'Drop of Blood', 'Gota de Sangue', 'objects', '12.0', false],
  ['🧬', 'DNA', 'DNA', 'objects', '11.0', false],
  ['🩹', 'Adhesive Bandage', 'Band-Aid', 'objects', '12.0', false],
  ['🩺', 'Stethoscope', 'Estetoscópio', 'objects', '12.0', false],
  ['🚪', 'Door', 'Porta', 'objects', '6.0', false],
  ['🛏️', 'Bed', 'Cama', 'objects', '7.0', false],
  ['🛋️', 'Couch and Lamp', 'Sofá e Lâmpada', 'objects', '7.0', false],
  ['🪑', 'Chair', 'Cadeira', 'objects', '12.0', false],
  ['🚽', 'Toilet', 'Vaso Sanitário', 'objects', '6.0', false],
  ['🪠', 'Plunger', 'Desentupidor', 'objects', '13.0', false],
  ['🚿', 'Shower', 'Chuveiro', 'objects', '6.0', false],
  ['🛁', 'Bathtub', 'Banheira', 'objects', '6.0', false],
  ['🪤', 'Mouse Trap', 'Armadilha', 'objects', '13.0', false],
  ['🧷', 'Safety Pin', 'Alfinete', 'objects', '11.0', false],
  ['🧺', 'Basket', 'Cesto', 'objects', '11.0', false],
  ['🧻', 'Roll of Paper', 'Rolo de Papel', 'objects', '11.0', false],
  ['🧼', 'Soap', 'Sabão', 'objects', '11.0', false],
  ['🫧', 'Bubbles', 'Bolhas', 'objects', '14.0', false],
  ['🪥', 'Toothbrush', 'Escova de Dentes', 'objects', '13.0', false],
  ['🧽', 'Sponge', 'Esponja', 'objects', '11.0', false],
  ['🧯', 'Fire Extinguisher', 'Extintor', 'objects', '11.0', false],
  ['🛒', 'Shopping Cart', 'Carrinho de Compras', 'objects', '6.0', false],
  ['🚬', 'Cigarette', 'Cigarro', 'objects', '6.0', false],
  ['⚰️', 'Coffin', 'Caixão', 'objects', '4.1', false],
  ['🪦', 'Headstone', 'Lápide', 'objects', '13.0', false],
  ['⚱️', 'Funeral Urn', 'Urna Funerária', 'objects', '4.1', false],
  ['🗳️', 'Ballot Box', 'Urna', 'objects', '7.0', false],
  ['📛', 'Name Badge', 'Crachá', 'objects', '6.0', false],
  ['🔰', 'Japanese Symbol for Beginner', 'Símbolo de Iniciante', 'objects', '6.0', false],
  ['📿', 'Prayer Beads', 'Rosário', 'objects', '8.0', false],
  ['🔑', 'Key', 'Chave', 'objects', '6.0', false],
  ['🗝️', 'Old Key', 'Chave Antiga', 'objects', '7.0', false],
  // ── Símbolos ────────────────────────────────────────────────────────
  ['✅', 'Check Mark Button', 'Marca de Verificação', 'symbols', '6.0', false],
  ['❌', 'Cross Mark', 'Marca de Cruz', 'symbols', '6.0', false],
  ['❓', 'Red Question Mark', 'Ponto de Interrogação Vermelho', 'symbols', '6.0', false],
  ['❗', 'Red Exclamation Mark', 'Ponto de Exclamação Vermelho', 'symbols', '5.2', false],
  ['⚠️', 'Warning', 'Aviso', 'symbols', '4.0', false],
  ['🚫', 'Prohibited', 'Proibido', 'symbols', '6.0', false],
  ['🛑', 'Stop Sign', 'Sinal de Pare', 'symbols', '9.0', false],
  ['🔴', 'Red Circle', 'Círculo Vermelho', 'symbols', '6.0', false],
  ['🟠', 'Orange Circle', 'Círculo Laranja', 'symbols', '12.0', false],
  ['🟡', 'Yellow Circle', 'Círculo Amarelo', 'symbols', '12.0', false],
  ['🟢', 'Green Circle', 'Círculo Verde', 'symbols', '12.0', false],
  ['🔵', 'Blue Circle', 'Círculo Azul', 'symbols', '6.0', false],
  ['🟣', 'Purple Circle', 'Círculo Roxo', 'symbols', '12.0', false],
  ['⬆️', 'Up Arrow', 'Seta para Cima', 'symbols', '4.0', false],
  ['↗️', 'Up-Right Arrow', 'Seta para Cima-Direita', 'symbols', '4.0', false],
  ['➡️', 'Right Arrow', 'Seta para Direita', 'symbols', '4.0', false],
  ['↘️', 'Down-Right Arrow', 'Seta para Baixo-Direita', 'symbols', '4.0', false],
  ['⬇️', 'Down Arrow', 'Seta para Baixo', 'symbols', '4.0', false],
  ['↙️', 'Down-Left Arrow', 'Seta para Baixo-Esquerda', 'symbols', '4.0', false],
  ['⬅️', 'Left Arrow', 'Seta para Esquerda', 'symbols', '4.0', false],
  ['↖️', 'Up-Left Arrow', 'Seta para Cima-Esquerda', 'symbols', '4.0', false],
  ['↕️', 'Up-Down Arrow', 'Seta para Cima-Baixo', 'symbols', '4.0', false],
  ['↔️', 'Left-Right Arrow', 'Seta para Esquerda-Direita', 'symbols', '4.0', false],
  ['🔄', 'Counterclockwise Arrows', 'Setas Anticlockwise', 'symbols', '6.0', false],
  ['🔃', 'Clockwise Arrows', 'Setas Clockwise', 'symbols', '6.0', false],
  ['🔙', 'Back Arrow', 'Seta Voltar', 'symbols', '6.0', false],
  ['🔚', 'End Arrow', 'Seta Fim', 'symbols', '6.0', false],
  ['🔛', 'On Arrow', 'Seta Ligado', 'symbols', '6.0', false],
  ['🔜', 'Soon Arrow', 'Seta Breve', 'symbols', '6.0', false],
  ['top', 'Top Arrow', 'Seta Topo', 'symbols', '6.0', false],
  ['🔁', 'Repeat Button', 'Repetir', 'symbols', '6.0', false],
  ['🔂', 'Repeat Single Button', 'Repetir Uma Vez', 'symbols', '6.0', false],
  ['▶️', 'Play Button', 'Reproduzir', 'symbols', '6.0', false],
  ['⏩', 'Fast-Forward Button', 'Avançar Rápido', 'symbols', '6.0', false],
  ['⏭️', 'Next Track Button', 'Próxima Faixa', 'symbols', '7.0', false],
  ['⏯️', 'Play or Pause Button', 'Reproduzir ou Pausar', 'symbols', '7.0', false],
  ['◀️', 'Reverse Button', 'Voltar', 'symbols', '6.0', false],
  ['⏪', 'Fast Reverse Button', 'Voltar Rápido', 'symbols', '6.0', false],
  ['⏮️', 'Last Track Button', 'Faixa Anterior', 'symbols', '7.0', false],
  ['🔼', 'Upwards Button', 'Botão para Cima', 'symbols', '6.0', false],
  ['⏫', 'Fast Up Button', 'Cima Rápido', 'symbols', '6.0', false],
  ['🔽', 'Downwards Button', 'Botão para Baixo', 'symbols', '6.0', false],
  ['⏬', 'Fast Down Button', 'Baixo Rápido', 'symbols', '6.0', false],
  ['⏸️', 'Pause Button', 'Pausar', 'symbols', '7.0', false],
  ['⏹️', 'Stop Button', 'Parar', 'symbols', '7.0', false],
  ['⏺️', 'Record Button', 'Gravar', 'symbols', '7.0', false],
  ['⏏️', 'Eject Button', 'Ejetar', 'symbols', '7.0', false],
  ['🎦', 'Cinema', 'Cinema', 'symbols', '6.0', false],
  ['🔅', 'Dim Button', 'Diminuir Brilho', 'symbols', '6.0', false],
  ['🔆', 'Bright Button', 'Aumentar Brilho', 'symbols', '6.0', false],
  ['📶', 'Antenna Bars', 'Barras de Sinal', 'symbols', '6.0', false],
  ['🛜', 'Wireless', 'Sem Fio', 'symbols', '15.0', false],
  ['📳', 'Vibration Mode', 'Modo de Vibração', 'symbols', '6.0', false],
  ['📴', 'Mobile Phone Off', 'Celular Desligado', 'symbols', '6.0', false],
  ['♀️', 'Female Sign', 'Símbolo Feminino', 'symbols', '4.0', false],
  ['♂️', 'Male Sign', 'Símbolo Masculino', 'symbols', '4.0', false],
  ['⚧️', 'Transgender Symbol', 'Símbolo Transgênero', 'symbols', '13.0', false],
  ['✖️', 'Multiply', 'Multiplicar', 'symbols', '6.0', false],
  ['➕', 'Plus', 'Mais', 'symbols', '6.0', false],
  ['➖', 'Minus', 'Menos', 'symbols', '6.0', false],
  ['➗', 'Divide', 'Dividir', 'symbols', '6.0', false],
  ['🟰', 'Heavy Equals Sign', 'Sinal de Igual Grande', 'symbols', '14.0', false],
  ['♾️', 'Infinity', 'Infinito', 'symbols', '11.0', false],
  ['™️', 'Trade Mark', 'Marca Registrada', 'symbols', '1.1', false],
  ['©️', 'Copyright', 'Copyright', 'symbols', '1.1', false],
  ['®️', 'Registered', 'Registrado', 'symbols', '1.1', false],
  ['‼️', 'Double Exclamation Mark', 'Ponto de Exclamação Duplo', 'symbols', '1.1', false],
  ['⁉️', 'Exclamation Question Mark', 'Interrogação com Exclamação', 'symbols', '3.0', false],
  ['💲', 'Heavy Dollar Sign', 'Sinal de Dólar', 'symbols', '6.0', false],
  ['💱', 'Currency Exchange', 'Câmbio', 'symbols', '6.0', false],
  ['📋', 'Clipboard', 'Prancheta', 'objects', '6.0', false],
  ['📌', 'Pushpin', 'Tachinha', 'objects', '6.0', false],
  ['📍', 'Round Pushpin', 'Tachinha Redonda', 'objects', '6.0', false],
  ['📎', 'Paperclip', 'Clips', 'objects', '6.0', false],
  ['🖇️', 'Linked Paperclips', 'Clips Unidos', 'objects', '7.0', false],
  ['📏', 'Straight Ruler', 'Régua', 'objects', '6.0', false],
  ['📐', 'Triangular Rizer', 'Régua Triangular', 'objects', '6.0', false],
  ['✂️', 'Scissors', 'Tesoura', 'objects', '6.0', false],
  ['🗃️', 'Card File Box', 'Caixa de Cartões', 'objects', '7.0', false],
  ['🗄️', 'File Cabinet', 'Arquivo', 'objects', '7.0', false],
  ['🗑️', 'Wastebasket', 'Lixeira', 'objects', '7.0', false],
  ['🔒', 'Locked', 'Trancado', 'objects', '6.0', false],
  ['🔓', 'Unlocked', 'Destrancado', 'objects', '6.0', false],
  ['🔏', 'Locked with Pen', 'Trancado com Caneta', 'objects', '6.0', false],
  ['🔐', 'Locked with Key', 'Trancado com Chave', 'objects', '6.0', false],
  ['🔑', 'Key', 'Chave', 'objects', '6.0', false],
  // ── Mais Objetos ────────────────────────────────────────────────
  ['📖', 'Open Book', 'Livro Aberto', 'objects', '6.0', false],
  ['📚', 'Books', 'Livros', 'objects', '6.0', false],
  ['📝', 'Memo', 'Memorando', 'objects', '6.0', false],
  ['✏️', 'Pencil', 'Lápis', 'objects', '1.1', false],
  ['✒️', 'Black Nib', 'Ponta de Caneta', 'objects', '1.1', false],
  ['🖊️', 'Pen', 'Caneta', 'objects', '7.0', false],
  ['🖋️', 'Fountain Pen', 'Caneta Tinteiro', 'objects', '7.0', false],
  ['🖌️', 'Paintbrush', 'Pincel', 'objects', '7.0', false],
  ['🖍️', 'Crayon', 'Giz de Cera', 'objects', '7.0', false],
  ['💼', 'Briefcase', 'Maleta', 'objects', '6.0', false],
  ['📁', 'File Folder', 'Pasta', 'objects', '6.0', false],
  ['📂', 'Open File Folder', 'Pasta Aberta', 'objects', '6.0', false],
  ['🗂️', 'Card Index Dividers', 'Divisores', 'objects', '7.0', false],
  ['📅', 'Calendar', 'Calendário', 'objects', '6.0', false],
  ['📆', 'Tear-Off Calendar', 'Calendário Rasgado', 'objects', '6.0', false],
  ['🗒️', 'Spiral Notepad', 'Bloco Espiral', 'objects', '7.0', false],
  ['🗓️', 'Spiral Calendar', 'Calendário Espiral', 'objects', '7.0', false],
  ['📇', 'Card Index', 'Índice', 'objects', '6.0', false],
  ['📈', 'Chart Increasing', 'Gráfico Subindo', 'objects', '6.0', false],
  ['📉', 'Chart Decreasing', 'Gráfico Descendo', 'objects', '6.0', false],
  ['📊', 'Bar Chart', 'Gráfico de Barras', 'objects', '6.0', false],
  ['📋', 'Clipboard', 'Prancheta', 'objects', '6.0', false],
  ['📌', 'Pushpin', 'Tachinha', 'objects', '6.0', false],
  ['📍', 'Round Pushpin', 'Tachinha Redonda', 'objects', '6.0', false],
  ['📎', 'Paperclip', 'Clips', 'objects', '6.0', false],
  ['🔒', 'Locked', 'Trancado', 'objects', '6.0', false],
  ['🔓', 'Unlocked', 'Destrancado', 'objects', '6.0', false],
]

// Remover duplicatas (baseado no emoji char)
const UNIQUE_EMOJIS = Array.from(new Map(EMOJI_DATA.map((e) => [e[0], e])).values())

function emojiToCodePoint(emoji) {
  const cp = []
  for (const char of emoji) {
    const code = char.codePointAt(0)
    if (code > 0xFFFF) {
      cp.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`)
    } else if (code > 0x7F) {
      cp.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`)
    }
  }
  return cp.join(' ')
}

function emojiToHtmlEntity(emoji) {
  const cp = []
  for (const char of emoji) {
    cp.push(`&#${char.codePointAt(0)};`)
  }
  return cp.join('')
}

function emojiToJsEscape(emoji) {
  const cp = []
  for (const char of emoji) {
    const code = char.codePointAt(0)
    cp.push(code > 0xFFFF ? `\\u{${code.toString(16)}}` : `\\u${code.toString(16).padStart(4, '0')}`)
  }
  return cp.join('')
}

function emojiToCssEscape(emoji) {
  const cp = []
  for (const char of emoji) {
    const code = char.codePointAt(0)
    cp.push(`\\${code.toString(16).toUpperCase()}`)
  }
  return cp.join(' ')
}

function emojiToUtf8(emoji) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(emoji)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ').toUpperCase()
}

export default function EmojiReferencePage() {
  const { lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedEmoji, setSelectedEmoji] = useState(null)
  const [copiedFormat, setCopiedFormat] = useState(null)

  const t = {
    pt: {
      title: 'Referência de Emojis Unicode',
      subtitle: 'Pesquise por nome, code point ou caractere. Clique num emoji para ver todas as representações.',
      searchPlaceholder: 'Buscar por nome, code point ou caractere...',
      all: 'Todas',
      category: 'Categoria',
      count: 'emojis',
      noResults: 'Nenhum emoji encontrado.',
      copy: 'Copiar',
      copied: 'Copiado!',
      formats: 'Formatos de Cópia',
      char: 'Caractere',
      html: 'HTML Entity',
      js: 'JavaScript Escape',
      css: 'CSS Escape',
      codepoint: 'Code Point',
      version: 'Versão Unicode',
      utf8: 'UTF-8 Bytes',
      name: 'Nome',
      details: 'Detalhes do Emoji',
      skinTones: 'Suporta tons de pele',
      yes: 'Sim',
      no: 'Não',
      sourceTab: 'Código-fonte',
      sourceHint: 'O código abaixo mostra como os dados são filtrados e renderizados.',
    },
    en: {
      title: 'Unicode Emoji Reference',
      subtitle: 'Search by name, code point, or character. Click an emoji to see all representations.',
      searchPlaceholder: 'Search by name, code point, or character...',
      all: 'All',
      category: 'Category',
      count: 'emojis',
      noResults: 'No emojis found.',
      copy: 'Copy',
      copied: 'Copied!',
      formats: 'Copy Formats',
      char: 'Character',
      html: 'HTML Entity',
      js: 'JavaScript Escape',
      css: 'CSS Escape',
      codepoint: 'Code Point',
      version: 'Unicode Version',
      utf8: 'UTF-8 Bytes',
      name: 'Name',
      details: 'Emoji Details',
      skinTones: 'Supports skin tones',
      yes: 'Yes',
      no: 'No',
      sourceTab: 'Source Code',
      sourceHint: 'The code below shows how data is filtered and rendered.',
    },
  }[lang]

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return UNIQUE_EMOJIS.filter((e) => {
      if (category !== 'all' && e[3] !== category) return false
      if (!q) return true
      return (
        e[0].includes(q) ||
        e[1].toLowerCase().includes(q) ||
        e[2].toLowerCase().includes(q) ||
        e[4].includes(q) ||
        emojiToCodePoint(e[0]).toLowerCase().includes(q)
      )
    })
  }, [search, category])

  const copyText = useCallback(
    (text, format) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedFormat(format)
        message.success(t.copied)
        setTimeout(() => setCopiedFormat(null), 1500)
      })
    },
    [t.copied],
  )

  const copyFormats = selectedEmoji
    ? [
        { label: t.char, value: selectedEmoji[0], key: 'char' },
        { label: t.html, value: emojiToHtmlEntity(selectedEmoji[0]), key: 'html' },
        { label: t.js, value: emojiToJsEscape(selectedEmoji[0]), key: 'js' },
        { label: t.css, value: emojiToCssEscape(selectedEmoji[0]), key: 'css' },
        { label: t.codepoint, value: emojiToCodePoint(selectedEmoji[0]), key: 'codepoint' },
        { label: t.utf8, value: emojiToUtf8(selectedEmoji[0]), key: 'utf8' },
      ]
    : []

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Title level={2}>
        <SmileOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>

      <Input
        prefix={<SearchOutlined />}
        placeholder={t.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="large"
      />

      <Space wrap>
        <Radio.Group
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((c) => (
            <Radio.Button key={c.key} value={c.key}>
              {lang === 'pt' ? c.pt : c.en}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Text type="secondary">
        {filtered.length} {t.count}
      </Text>

      {selectedEmoji && (
        <Card
          title={
            <span>
              {t.details}: <span style={{ fontSize: 48 }}>{selectedEmoji[0]}</span>
            </span>
          }
          extra={<Button size="small" onClick={() => setSelectedEmoji(null)}>✕</Button>}
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>{t.name}:</Text>{' '}
              <Text>{lang === 'pt' ? selectedEmoji[2] : selectedEmoji[1]}</Text>
            </div>
            <div>
              <Text strong>{t.version}:</Text>{' '}
              <Tag>{selectedEmoji[4]}</Tag>
            </div>
            <div>
              <Text strong>{t.category}:</Text>{' '}
              <Tag>{CATEGORIES.find((c) => c.key === selectedEmoji[3]) ? (lang === 'pt' ? CATEGORIES.find((c) => c.key === selectedEmoji[3]).pt : CATEGORIES.find((c) => c.key === selectedEmoji[3]).en) : selectedEmoji[3]}</Tag>
            </div>
            <div>
              <Text strong>{t.skinTones}:</Text>{' '}
              <Tag color={selectedEmoji[5] ? 'green' : 'default'}>
                {selectedEmoji[5] ? t.yes : t.no}
              </Tag>
            </div>
            <Paragraph strong style={{ marginTop: 8 }}>{t.formats}:</Paragraph>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {copyFormats.map((f) => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary" style={{ minWidth: 120, fontSize: 13 }}>{f.label}:</Text>
                  <Text code style={{ flex: 1, fontSize: 13 }}>{f.value}</Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(f.value, f.key)}
                  >
                    {t.copy}
                  </Button>
                </div>
              ))}
            </Space>
          </Space>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">{t.noResults}</Text>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
            gap: 4,
          }}
        >
          {filtered.map((e) => (
            <div
              key={e[0] + e[1]}
              onClick={() => setSelectedEmoji(e)}
              style={{
                fontSize: 28,
                lineHeight: '44px',
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: 8,
                border: selectedEmoji && selectedEmoji[0] === e[0] && selectedEmoji[1] === e[1] ? '2px solid #1677ff' : '1px solid transparent',
                transition: 'background .15s, border-color .15s',
                background: selectedEmoji && selectedEmoji[0] === e[0] && selectedEmoji[1] === e[1] ? '#e6f4ff' : 'transparent',
              }}
              onMouseEnter={(ev) => { ev.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={(ev) => { ev.currentTarget.style.background = selectedEmoji && selectedEmoji[0] === e[0] && selectedEmoji[1] === e[1] ? '#e6f4ff' : 'transparent' }}
              title={`${lang === 'pt' ? e[2] : e[1]} (${e[0]})`}
            >
              {e[0]}
            </div>
          ))}
        </div>
      )}

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTab,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Paragraph type="secondary">{t.sourceHint}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420, fontSize: 12 }}>
                  <code>{`// Filtros e renderização dos emojis
const filtered = UNIQUE_EMOJIS.filter((e) => {
  if (category !== 'all' && e[3] !== category) return false
  if (!q) return true
  return (
    e[0].includes(q) ||
    e[1].toLowerCase().includes(q) ||
    e[2].toLowerCase().includes(q) ||
    emojiToCodePoint(e[0]).toLowerCase().includes(q)
  )
})

// Representações de um emoji:
emojiToCodePoint(e)    // "U+1F600"
emojiToHtmlEntity(e)   // "&#128512;"
emojiToJsEscape(e)     // "\\\\u{1F600}"
emojiToCssEscape(e)    // "\\\\1F600"
emojiToUtf8(e)         // "F0 9F 98 80" (UTF-8 bytes)`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
