import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Space, Input, Radio, Tag, Button, Alert, Collapse, message, Tooltip } from 'antd'
import { ReadOutlined, SearchOutlined, CopyOutlined, SmileOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Categorias na ordem em que aparecem na página. `key` é usada nos dados.
const CATEGORIES = [
  { key: 'smileys', pt: 'Caras & Emoções', en: 'Smileys & Emotion' },
  { key: 'people', pt: 'Pessoas & Gestos', en: 'People & Body' },
  { key: 'animal', pt: 'Animais & Natureza', en: 'Animals & Nature' },
  { key: 'food', pt: 'Comida & Bebida', en: 'Food & Drink' },
  { key: 'travel', pt: 'Viagem & Lugares', en: 'Travel & Places' },
  { key: 'activity', pt: 'Atividades', en: 'Activities' },
  { key: 'objects', pt: 'Objetos', en: 'Objects' },
  { key: 'symbols', pt: 'Símbolos', en: 'Symbols' },
  { key: 'flags', pt: 'Bandeiras', en: 'Flags' },
]

// [emoji, nome em inglês, nome em português, shortcode GitHub (ou null), categoria]
const DATA = [
  // ── Caras & Emoções ────────────────────────────────────────────────
  ['😀', 'Grinning face', 'Rosto sorridente', ':grinning:', 'smileys'],
  ['😄', 'Smiling face with open mouth', 'Rosto sorridente de boca aberta', ':smile:', 'smileys'],
  ['😁', 'Beaming face with smiling eyes', 'Rosto radiante', ':grin:', 'smileys'],
  ['😂', 'Face with tears of joy', 'Rindo de chorar', ':joy:', 'smileys'],
  ['🤣', 'Rolling on the floor laughing', 'Rindo até cair no chão', ':rofl:', 'smileys'],
  ['😊', 'Smiling face with smiling eyes', 'Rosto sorridente com olhos sorridentes', ':blush:', 'smileys'],
  ['😍', 'Smiling face with heart-eyes', 'Rosto apaixonado', ':heart_eyes:', 'smileys'],
  ['😘', 'Face blowing a kiss', 'Rosto mandando beijo', ':kissing_heart:', 'smileys'],
  ['😎', 'Smiling face with sunglasses', 'Rosto descolado de óculos', ':sunglasses:', 'smileys'],
  ['🤓', 'Nerd face', 'Rosto nerd', ':nerd_face:', 'smileys'],
  ['🤔', 'Thinking face', 'Rosto pensativo', ':thinking:', 'smileys'],
  ['🥺', 'Pleading face', 'Rosto suplicante', ':pleading_face:', 'smileys'],
  ['🥳', 'Partying face', 'Rosto festeiro', ':partying_face:', 'smileys'],
  ['😴', 'Sleeping face', 'Rosto dormindo', ':sleeping:', 'smileys'],
  ['😪', 'Sleepy face', 'Rosto sonolento', ':sleepy:', 'smileys'],
  ['😭', 'Loudly crying face', 'Rosto chorando alto', ':sob:', 'smileys'],
  ['😢', 'Crying face', 'Rosto de choro', ':cry:', 'smileys'],
  ['😡', 'Pouting face', 'Rosto bravo', ':rage:', 'smileys'],
  ['😠', 'Angry face', 'Rosto irritado', ':angry:', 'smileys'],
  ['😱', 'Face screaming in fear', 'Gritando de medo', ':scream:', 'smileys'],
  ['😨', 'Fearful face', 'Rosto amedrontado', ':fearful:', 'smileys'],
  ['😰', 'Anxious face with sweat', 'Ansioso com suor', ':sweat:', 'smileys'],
  ['😅', 'Grinning face with sweat', 'Sorrindo com suor', ':sweat_smile:', 'smileys'],
  ['😷', 'Face with medical mask', 'De máscara médica', ':mask:', 'smileys'],
  ['🤒', 'Face with thermometer', 'Com termômetro', ':face_with_thermometer:', 'smileys'],
  ['🤕', 'Face with head-bandage', 'Com atadura na cabeça', ':face_with_head_bandage:', 'smileys'],
  ['🤠', 'Cowboy hat face', 'Rosto de cowboy', ':cowboy_hat_face:', 'smileys'],
  ['🤑', 'Money-mouth face', 'Rosto com dinheiro na boca', ':money_mouth_face:', 'smileys'],
  ['🥱', 'Yawning face', 'Rosto bocejando', ':yawning_face:', 'smileys'],
  ['😲', 'Astonished face', 'Rosto espantado', ':astonished:', 'smileys'],
  ['😳', 'Flushed face', 'Rosto corado', ':flushed:', 'smileys'],
  ['😞', 'Disappointed face', 'Rosto decepcionado', ':disappointed:', 'smileys'],
  ['😔', 'Pensive face', 'Rosto pensativo (triste)', ':pensive:', 'smileys'],
  ['😏', 'Smirking face', 'Sorriso maroto', ':smirk:', 'smileys'],
  ['😒', 'Unamused face', 'Rosto sem graça', ':unamused:', 'smileys'],
  ['😌', 'Relieved face', 'Rosto aliviado', ':relieved:', 'smileys'],
  ['😜', 'Winking face with tongue', 'Piscando com a língua para fora', ':stuck_out_tongue_winking_eye:', 'smileys'],
  ['😝', 'Squinting face with tongue', 'Careta com a língua para fora', ':stuck_out_tongue_closed_eyes:', 'smileys'],
  ['😛', 'Face with stuck-out tongue', 'Rosto com a língua para fora', ':stuck_out_tongue:', 'smileys'],
  ['😬', 'Grimacing face', 'Rosto fazendo careta', ':grimacing:', 'smileys'],
  ['😇', 'Smiling face with halo', 'Rosto com auréola', ':innocent:', 'smileys'],
  ['🤗', 'Hugging face', 'Rosto abraçando', ':hugging_face:', 'smileys'],
  ['🤫', 'Shushing face', 'Rosto pedindo silêncio', ':shushing_face:', 'smileys'],
  ['🤐', 'Zipper-mouth face', 'Boca com zíper', ':zipper_mouth_face:', 'smileys'],
  ['🙃', 'Upside-down face', 'Rosto de cabeça para baixo', ':upside_down_face:', 'smileys'],
  ['😉', 'Winking face', 'Rosto piscando', ':wink:', 'smileys'],
  ['😶', 'Face without mouth', 'Rosto sem boca', ':no_mouth:', 'smileys'],
  ['😐', 'Neutral face', 'Rosto neutro', ':neutral_face:', 'smileys'],
  ['🙄', 'Face with rolling eyes', 'Revirando os olhos', ':rolling_eyes:', 'smileys'],
  ['🤭', 'Face with hand over mouth', 'Com a mão na boca', ':smiling_face_with_hand_over_mouth:', 'smileys'],
  ['👻', 'Ghost', 'Fantasma', ':ghost:', 'smileys'],
  ['👽', 'Alien', 'Alienígena', ':alien:', 'smileys'],
  ['🤖', 'Robot', 'Robô', ':robot:', 'smileys'],
  ['💀', 'Skull', 'Caveira', ':skull:', 'smileys'],
  ['💩', 'Pile of poo', 'Cocô', ':poop:', 'smileys'],
  ['🤡', 'Clown face', 'Cara de palhaço', ':clown_face:', 'smileys'],
  ['👹', 'Ogre', 'Ogro', ':japanese_ogre:', 'smileys'],
  ['👺', 'Goblin', 'Duende', ':japanese_goblin:', 'smileys'],
  ['😈', 'Smiling face with horns', 'Rosto com chifres', ':smiling_imp:', 'smileys'],
  ['👿', 'Angry face with horns', 'Diabo bravo', ':imp:', 'smileys'],
  ['🔥', 'Fire', 'Fogo', ':fire:', 'smileys'],
  ['⭐', 'Star', 'Estrela', ':star:', 'smileys'],
  ['✨', 'Sparkles', 'Brilhos', ':sparkles:', 'smileys'],
  ['⚡', 'High voltage', 'Raio', ':zap:', 'smileys'],
  ['💥', 'Collision', 'Explosão', ':boom:', 'smileys'],
  ['💫', 'Dizzy', 'Tonto (estrelas)', ':dizzy:', 'smileys'],
  ['💯', 'Hundred points', 'Cem pontos', ':100:', 'smileys'],
  ['🌈', 'Rainbow', 'Arco-íris', ':rainbow:', 'smileys'],
  ['🎂', 'Birthday cake', 'Bolo de aniversário', ':birthday:', 'smileys'],
  ['🎉', 'Party popper', 'Confete de festa', ':tada:', 'smileys'],
  ['🎊', 'Confetti ball', 'Bola de confete', ':confetti_ball:', 'smileys'],
  ['🎁', 'Wrapped gift', 'Presente embrulhado', ':gift:', 'smileys'],

  // ── Pessoas & Gestos ───────────────────────────────────────────────
  ['👋', 'Waving hand', 'Acenando com a mão', ':wave:', 'people'],
  ['✋', 'Raised hand', 'Mão levantada', ':raised_hand:', 'people'],
  ['🖐️', 'Hand with fingers splayed', 'Mão aberta', ':hand_splayed:', 'people'],
  ['👌', 'OK hand', 'Sinal de OK', ':ok_hand:', 'people'],
  ['👍', 'Thumbs up', 'Joinha (positivo)', ':thumbsup:', 'people'],
  ['👎', 'Thumbs down', 'Joinha (negativo)', ':thumbsdown:', 'people'],
  ['✌️', 'Victory hand', 'Sinal de vitória', ':v:', 'people'],
  ['👏', 'Clapping hands', 'Palmas', ':clap:', 'people'],
  ['🤝', 'Handshake', 'Aperto de mãos', ':handshake:', 'people'],
  ['🙏', 'Folded hands', 'Mãos juntas (por favor/obrigado)', ':pray:', 'people'],
  ['💪', 'Flexed biceps', 'Bíceps flexionado', ':muscle:', 'people'],
  ['🫶', 'Heart hands', 'Mãos em coração', ':heart_hands:', 'people'],
  ['👈', 'Backhand index pointing left', 'Dedo apontando para a esquerda', ':point_left:', 'people'],
  ['👉', 'Backhand index pointing right', 'Dedo apontando para a direita', ':point_right:', 'people'],
  ['👆', 'Backhand index pointing up', 'Dedo apontando para cima', ':point_up_2:', 'people'],
  ['👇', 'Backhand index pointing down', 'Dedo apontando para baixo', ':point_down:', 'people'],
  ['☝️', 'Index pointing up', 'Indicador para cima', ':point_up:', 'people'],
  ['🤞', 'Crossed fingers', 'Dedos cruzados (torcer)', ':crossed_fingers:', 'people'],
  ['🫰', 'Hand with index finger and thumb crossed', 'Dedo indicador e polegar cruzados', ':hand_with_index_finger_and_thumb_crossed:', 'people'],
  ['🤟', 'Love-you gesture', 'Gestos “eu te amo” (LIBRAS)', ':love_you_gesture:', 'people'],
  ['👊', 'Oncoming fist', 'Punho vindo de frente', ':facepunch:', 'people'],
  ['✊', 'Raised fist', 'Punho erguido', ':fist:', 'people'],
  ['🙌', 'Raising hands', 'Mãos para o alto', ':raised_hands:', 'people'],
  ['👐', 'Open hands', 'Mãos abertas', ':open_hands:', 'people'],
  ['🤲', 'Palms up together', 'Mãos para cima', ':palms_up_together:', 'people'],
  ['🙋', 'Raising hand', 'Pessoa com a mão levantada', ':raising_hand:', 'people'],
  ['🧠', 'Brain', 'Cérebro', ':brain:', 'people'],
  ['🫀', 'Anatomical heart', 'Coração anatômico', ':anatomical_heart:', 'people'],
  ['🦴', 'Bone', 'Osso', ':bone:', 'people'],
  ['👀', 'Eyes', 'Olhos', ':eyes:', 'people'],
  ['👁️', 'Eye', 'Olho', ':eye:', 'people'],
  ['👂', 'Ear', 'Orelha', ':ear:', 'people'],
  ['👃', 'Nose', 'Nariz', ':nose:', 'people'],
  ['👄', 'Mouth', 'Boca', ':lips:', 'people'],
  ['👅', 'Tongue', 'Língua', ':tongue:', 'people'],
  ['💋', 'Kiss mark', 'Marca de beijo', ':kiss:', 'people'],
  ['💘', 'Heart with arrow', 'Coração com flecha', ':cupid:', 'people'],
  ['💕', 'Two hearts', 'Dois corações', ':two_hearts:', 'people'],
  ['💖', 'Sparkling heart', 'Coração brilhante', ':sparkling_heart:', 'people'],
  ['💗', 'Growing heart', 'Coração crescendo', ':heartpulse:', 'people'],
  ['💓', 'Beating heart', 'Coração pulsando', ':heartbeat:', 'people'],
  ['💞', 'Revolving hearts', 'Corações girando', ':revolving_hearts:', 'people'],
  ['❤️', 'Red heart', 'Coração vermelho', ':heart:', 'people'],
  ['🧡', 'Orange heart', 'Coração laranja', ':orange_heart:', 'people'],
  ['💛', 'Yellow heart', 'Coração amarelo', ':yellow_heart:', 'people'],
  ['💚', 'Green heart', 'Coração verde', ':green_heart:', 'people'],
  ['💙', 'Blue heart', 'Coração azul', ':blue_heart:', 'people'],
  ['💜', 'Purple heart', 'Coração roxo', ':purple_heart:', 'people'],
  ['🖤', 'Black heart', 'Coração preto', ':black_heart:', 'people'],
  ['🤍', 'White heart', 'Coração branco', ':white_heart:', 'people'],
  ['🤎', 'Brown heart', 'Coração marrom', ':brown_heart:', 'people'],
  ['💔', 'Broken heart', 'Coração partido', ':broken_heart:', 'people'],
  ['💬', 'Speech balloon', 'Balão de fala', ':speech_balloon:', 'people'],
  ['💭', 'Thought balloon', 'Balão de pensamento', ':thought_balloon:', 'people'],
  ['🗨️', 'Left speech bubble', 'Balão de fala à esquerda', ':left_speech_bubble:', 'people'],
  ['🕵️', 'Detective', 'Detetive', ':detective:', 'people'],
  ['👨‍💻', 'Man technologist', 'Homem desenvolvedor', ':man_technologist:', 'people'],
  ['👩‍💻', 'Woman technologist', 'Mulher desenvolvedora', ':woman_technologist:', 'people'],
  ['🧑‍💻', 'Person technologist', 'Pessoa desenvolvedora', ':technologist:', 'people'],
  ['🤴', 'Prince', 'Príncipe', ':prince:', 'people'],
  ['👸', 'Princess', 'Princesa', ':princess:', 'people'],
  ['👷', 'Construction worker', 'Trabalhador da construção', ':construction_worker:', 'people'],
  ['💂', 'Guard', 'Guarda', ':guard:', 'people'],
  ['👮', 'Police officer', 'Policial', ':police_officer:', 'people'],
  ['🏃', 'Runner', 'Pessoa correndo', ':runner:', 'people'],
  ['🚶', 'Person walking', 'Pessoa andando', ':walking:', 'people'],
  ['🧑', 'Person', 'Pessoa', ':adult:', 'people'],
  ['👦', 'Boy', 'Menino', ':boy:', 'people'],
  ['👧', 'Girl', 'Menina', ':girl:', 'people'],
  ['👨', 'Man', 'Homem', ':man:', 'people'],
  ['👩', 'Woman', 'Mulher', ':woman:', 'people'],
  ['👴', 'Old man', 'Homem idoso', ':older_man:', 'people'],
  ['👵', 'Old woman', 'Mulher idosa', ':older_woman:', 'people'],
  ['👶', 'Baby', 'Bebê', ':baby:', 'people'],
  ['👥', 'Busts in silhouette', 'Silhuetas de pessoas', ':busts_in_silhouette:', 'people'],
  ['🗣️', 'Speaking head', 'Cabeça falando', ':speaking_head:', 'people'],

  // ── Animais & Natureza ─────────────────────────────────────────────
  ['🐶', 'Dog face', 'Cara de cachorro', ':dog:', 'animal'],
  ['🐱', 'Cat face', 'Cara de gato', ':cat:', 'animal'],
  ['🐭', 'Mouse face', 'Cara de rato', ':mouse:', 'animal'],
  ['🐹', 'Hamster face', 'Cara de hamster', ':hamster:', 'animal'],
  ['🐰', 'Rabbit face', 'Cara de coelho', ':rabbit:', 'animal'],
  ['🦊', 'Fox face', 'Cara de raposa', ':fox_face:', 'animal'],
  ['🐻', 'Bear', 'Urso', ':bear:', 'animal'],
  ['🐼', 'Panda', 'Panda', ':panda_face:', 'animal'],
  ['🐨', 'Koala', 'Coala', ':koala:', 'animal'],
  ['🐯', 'Tiger face', 'Cara de tigre', ':tiger:', 'animal'],
  ['🦁', 'Lion', 'Leão', ':lion:', 'animal'],
  ['🐮', 'Cow face', 'Cara de vaca', ':cow:', 'animal'],
  ['🐷', 'Pig face', 'Cara de porco', ':pig:', 'animal'],
  ['🐸', 'Frog face', 'Cara de sapo', ':frog:', 'animal'],
  ['🐵', 'Monkey face', 'Cara de macaco', ':monkey_face:', 'animal'],
  ['🐒', 'Monkey', 'Macaco', ':monkey:', 'animal'],
  ['🐔', 'Chicken', 'Galinha', ':chicken:', 'animal'],
  ['🐧', 'Penguin', 'Pinguim', ':penguin:', 'animal'],
  ['🐦', 'Bird', 'Pássaro', ':bird:', 'animal'],
  ['🦆', 'Duck', 'Pato', ':duck:', 'animal'],
  ['🦅', 'Eagle', 'Águia', ':eagle:', 'animal'],
  ['🦉', 'Owl', 'Coruja', ':owl:', 'animal'],
  ['🦄', 'Unicorn', 'Unicórnio', ':unicorn:', 'animal'],
  ['🐺', 'Wolf', 'Lobo', ':wolf:', 'animal'],
  ['🐗', 'Boar', 'Javali', ':boar:', 'animal'],
  ['🐴', 'Horse face', 'Cara de cavalo', ':horse:', 'animal'],
  ['🐝', 'Honeybee', 'Abelha', ':bee:', 'animal'],
  ['🦋', 'Butterfly', 'Borboleta', ':butterfly:', 'animal'],
  ['🐌', 'Snail', 'Caracol', ':snail:', 'animal'],
  ['🐢', 'Turtle', 'Tartaruga', ':turtle:', 'animal'],
  ['🐍', 'Snake', 'Cobra', ':snake:', 'animal'],
  ['🐞', 'Lady beetle', 'Joaninha', ':beetle:', 'animal'],
  ['🐛', 'Bug', 'Inseto (bug)', ':bug:', 'animal'],
  ['🦗', 'Cricket', 'Grilo', ':cricket:', 'animal'],
  ['🕷️', 'Spider', 'Aranha', ':spider:', 'animal'],
  ['🦂', 'Scorpion', 'Escorpião', ':scorpion:', 'animal'],
  ['🦀', 'Crab', 'Caranguejo', ':crab:', 'animal'],
  ['🐙', 'Octopus', 'Polvo', ':octopus:', 'animal'],
  ['🦞', 'Lobster', 'Lagosta', ':lobster:', 'animal'],
  ['🦈', 'Shark', 'Tubarão', ':shark:', 'animal'],
  ['🐳', 'Spouting whale', 'Baleia jorrando', ':whale:', 'animal'],
  ['🐬', 'Dolphin', 'Golfinho', ':dolphin:', 'animal'],
  ['🐟', 'Fish', 'Peixe', ':fish:', 'animal'],
  ['🐠', 'Tropical fish', 'Peixe tropical', ':tropical_fish:', 'animal'],
  ['🐡', 'Blowfish', 'Baiacu', ':blowfish:', 'animal'],
  ['🐊', 'Crocodile', 'Crocodilo', ':crocodile:', 'animal'],
  ['🐘', 'Elephant', 'Elefante', ':elephant:', 'animal'],
  ['🦛', 'Hippopotamus', 'Hipopótamo', ':hippopotamus:', 'animal'],
  ['🦒', 'Giraffe', 'Girafa', ':giraffe:', 'animal'],
  ['🦓', 'Zebra', 'Zebra', ':zebra:', 'animal'],
  ['🦙', 'Llama', 'Lhama', ':llama:', 'animal'],
  ['🐐', 'Goat', 'Cabra', ':goat:', 'animal'],
  ['🐑', 'Ewe', 'Ovelha', ':sheep:', 'animal'],
  ['🐎', 'Horse', 'Cavalo (corrida)', ':racehorse:', 'animal'],
  ['🦔', 'Hedgehog', 'Ouriço', ':hedgehog:', 'animal'],
  ['🦇', 'Bat', 'Morcego', ':bat:', 'animal'],
  ['🦚', 'Peacock', 'Pavão', ':peacock:', 'animal'],
  ['🦩', 'Flamingo', 'Flamingo', ':flamingo:', 'animal'],
  ['🦜', 'Parrot', 'Papagaio', ':parrot:', 'animal'],
  ['🌸', 'Cherry blossom', 'Flor de cerejeira', ':cherry_blossom:', 'animal'],
  ['🌹', 'Rose', 'Rosa', ':rose:', 'animal'],
  ['🌷', 'Tulip', 'Tulipa', ':tulip:', 'animal'],
  ['🌻', 'Sunflower', 'Girassol', ':sunflower:', 'animal'],
  ['🌵', 'Cactus', 'Cacto', ':cactus:', 'animal'],
  ['🌲', 'Evergreen tree', 'Árvore perene', ':evergreen_tree:', 'animal'],
  ['🌳', 'Deciduous tree', 'Árvore de folhas', ':deciduous_tree:', 'animal'],
  ['🌴', 'Palm tree', 'Palmeira', ':palm_tree:', 'animal'],
  ['🍀', 'Four leaf clover', 'Trevo de quatro folhas', ':four_leaf_clover:', 'animal'],
  ['🍁', 'Maple leaf', 'Folha de bordo', ':maple_leaf:', 'animal'],
  ['🍂', 'Fallen leaf', 'Folha caída', ':fallen_leaf:', 'animal'],
  ['🍄', 'Mushroom', 'Cogumelo', ':mushroom:', 'animal'],
  ['🌊', 'Water wave', 'Onda do mar', ':ocean:', 'animal'],
  ['💧', 'Droplet', 'Gota', ':droplet:', 'animal'],
  ['☀️', 'Sun', 'Sol', ':sunny:', 'animal'],
  ['🌙', 'Crescent moon', 'Lua crescente', ':crescent_moon:', 'animal'],
  ['🌟', 'Glowing star', 'Estrela brilhante', ':star2:', 'animal'],
  ['☁️', 'Cloud', 'Nuvem', ':cloud:', 'animal'],
  ['⛅', 'Sun behind cloud', 'Sol com nuvem', ':partly_sunny:', 'animal'],
  ['🌧️', 'Rain cloud', 'Nuvem de chuva', ':cloud_with_rain:', 'animal'],
  ['❄️', 'Snowflake', 'Floco de neve', ':snowflake:', 'animal'],

  // ── Comida & Bebida ────────────────────────────────────────────────
  ['🍎', 'Red apple', 'Maçã vermelha', ':apple:', 'food'],
  ['🍏', 'Green apple', 'Maçã verde', ':green_apple:', 'food'],
  ['🍌', 'Banana', 'Banana', ':banana:', 'food'],
  ['🍇', 'Grapes', 'Uvas', ':grapes:', 'food'],
  ['🍉', 'Watermelon', 'Melancia', ':watermelon:', 'food'],
  ['🍊', 'Tangerine', 'Tangerina', ':tangerine:', 'food'],
  ['🍋', 'Lemon', 'Limão', ':lemon:', 'food'],
  ['🍓', 'Strawberry', 'Morango', ':strawberry:', 'food'],
  ['🍒', 'Cherries', 'Cerejas', ':cherries:', 'food'],
  ['🫐', 'Blueberries', 'Mirtilos', ':blueberries:', 'food'],
  ['🍍', 'Pineapple', 'Abacaxi', ':pineapple:', 'food'],
  ['🥭', 'Mango', 'Manga', ':mango:', 'food'],
  ['🥑', 'Avocado', 'Abacate', ':avocado:', 'food'],
  ['🍆', 'Eggplant', 'Berinjela', ':eggplant:', 'food'],
  ['🥕', 'Carrot', 'Cenoura', ':carrot:', 'food'],
  ['🌽', 'Ear of corn', 'Espiga de milho', ':corn:', 'food'],
  ['🥦', 'Broccoli', 'Brócolis', ':broccoli:', 'food'],
  ['🧄', 'Garlic', 'Alho', ':garlic:', 'food'],
  ['🧅', 'Onion', 'Cebola', ':onion:', 'food'],
  ['🥔', 'Potato', 'Batata', ':potato:', 'food'],
  ['🍞', 'Bread', 'Pão', ':bread:', 'food'],
  ['🥐', 'Croissant', 'Croissant', ':croissant:', 'food'],
  ['🥯', 'Bagel', 'Bagel', ':bagel:', 'food'],
  ['🥞', 'Pancakes', 'Panquecas', ':pancakes:', 'food'],
  ['🧀', 'Cheese wedge', 'Queijo', ':cheese:', 'food'],
  ['🍖', 'Meat on bone', 'Carne com osso', ':meat_on_bone:', 'food'],
  ['🍗', 'Poultry leg', 'Sobrecoxa de frango', ':poultry_leg:', 'food'],
  ['🥩', 'Cut of meat', 'Corte de carne', ':cut_of_meat:', 'food'],
  ['🍔', 'Hamburger', 'Hambúrguer', ':hamburger:', 'food'],
  ['🍟', 'French fries', 'Batata frita', ':fries:', 'food'],
  ['🍕', 'Pizza', 'Pizza', ':pizza:', 'food'],
  ['🌭', 'Hot dog', 'Cachorro-quente', ':hotdog:', 'food'],
  ['🌮', 'Taco', 'Taco', ':taco:', 'food'],
  ['🌯', 'Burrito', 'Burrito', ':burrito:', 'food'],
  ['🍿', 'Popcorn', 'Pipoca', ':popcorn:', 'food'],
  ['🥗', 'Green salad', 'Salada verde', ':green_salad:', 'food'],
  ['🍝', 'Spaghetti', 'Espaguete', ':spaghetti:', 'food'],
  ['🍜', 'Steaming bowl', 'Macarrão com vapor', ':ramen:', 'food'],
  ['🍣', 'Sushi', 'Sushi', ':sushi:', 'food'],
  ['🍤', 'Fried shrimp', 'Camarão frito', ':fried_shrimp:', 'food'],
  ['🍚', 'Cooked rice', 'Arroz cozido', ':rice:', 'food'],
  ['🥟', 'Dumpling', 'Pastel', ':dumpling:', 'food'],
  ['🍦', 'Soft ice cream', 'Sorvete de massa', ':icecream:', 'food'],
  ['🍩', 'Doughnut', 'Donut', ':doughnut:', 'food'],
  ['🍪', 'Cookie', 'Biscoito', ':cookie:', 'food'],
  ['🍰', 'Shortcake', 'Bolo de frutas', ':cake:', 'food'],
  ['🧁', 'Cupcake', 'Cupcake', ':cupcake:', 'food'],
  ['🍫', 'Chocolate bar', 'Barra de chocolate', ':chocolate_bar:', 'food'],
  ['🍬', 'Candy', 'Doce', ':candy:', 'food'],
  ['🍭', 'Lollipop', 'Pirulito', ':lollipop:', 'food'],
  ['☕', 'Hot beverage', 'Café/quente', ':coffee:', 'food'],
  ['🍵', 'Teacup without handle', 'Xícara de chá', ':tea:', 'food'],
  ['🥤', 'Cup with straw', 'Copo com canudo', ':cup_with_straw:', 'food'],
  ['🧉', 'Mate', 'Chimarrão/mate', ':mate:', 'food'],
  ['🍺', 'Beer mug', 'Caneca de cerveja', ':beer:', 'food'],
  ['🍻', 'Clinking beer mugs', 'Brinde de cerveja', ':beers:', 'food'],
  ['🥂', 'Clinking glasses', 'Brinde de taças', ':clinking_glasses:', 'food'],
  ['🍷', 'Wine glass', 'Taça de vinho', ':wine_glass:', 'food'],
  ['🥃', 'Tumbler glass', 'Dose de whisky', ':tumbler_glass:', 'food'],
  ['🍸', 'Cocktail glass', 'Taça de coquetel', ':cocktail:', 'food'],
  ['🍹', 'Tropical drink', 'Drink tropical', ':tropical_drink:', 'food'],
  ['🧊', 'Ice', 'Gelo', ':ice_cube:', 'food'],

  // ── Viagem & Lugares ───────────────────────────────────────────────
  ['🚗', 'Automobile', 'Carro', ':red_car:', 'travel'],
  ['🚕', 'Taxi', 'Táxi', ':taxi:', 'travel'],
  ['🚙', 'Sport utility vehicle', 'SUV', ':blue_car:', 'travel'],
  ['🚌', 'Bus', 'Ônibus', ':bus:', 'travel'],
  ['🚓', 'Police car', 'Viatura policial', ':police_car:', 'travel'],
  ['🚑', 'Ambulance', 'Ambulância', ':ambulance:', 'travel'],
  ['🚒', 'Fire engine', 'Caminhão de bombeiros', ':fire_engine:', 'travel'],
  ['🚚', 'Delivery truck', 'Caminhão de entrega', ':truck:', 'travel'],
  ['🚛', 'Articulated lorry', 'Carreta', ':articulated_lorry:', 'travel'],
  ['🚜', 'Tractor', 'Trator', ':tractor:', 'travel'],
  ['🛵', 'Motor scooter', 'Moto de entrega', ':motor_scooter:', 'travel'],
  ['🏍️', 'Motorcycle', 'Motocicleta', ':motorcycle:', 'travel'],
  ['🚲', 'Bicycle', 'Bicicleta', ':bicycle:', 'travel'],
  ['🛴', 'Kick scooter', 'Patinete', ':kick_scooter:', 'travel'],
  ['🚂', 'Locomotive', 'Locomotiva', ':steam_locomotive:', 'travel'],
  ['🚆', 'Train', 'Trem', ':train2:', 'travel'],
  ['🚇', 'Metro', 'Metrô', ':metro:', 'travel'],
  ['🚉', 'Station', 'Estação', ':station:', 'travel'],
  ['✈️', 'Airplane', 'Avião', ':airplane:', 'travel'],
  ['🛫', 'Airplane departure', 'Decolagem', ':airplane_departure:', 'travel'],
  ['🛬', 'Airplane arrival', 'Aterrissagem', ':airplane_arrival:', 'travel'],
  ['🚁', 'Helicopter', 'Helicóptero', ':helicopter:', 'travel'],
  ['🚀', 'Rocket', 'Foguete', ':rocket:', 'travel'],
  ['🛸', 'Flying saucer', 'Disco voador', ':flying_saucer:', 'travel'],
  ['⛵', 'Sailboat', 'Veleiro', ':sailboat:', 'travel'],
  ['🚤', 'Speedboat', 'Lancha', ':speedboat:', 'travel'],
  ['🚢', 'Ship', 'Navio', ':ship:', 'travel'],
  ['🗺️', 'World map', 'Mapa-múndi', ':world_map:', 'travel'],
  ['🗼', 'Tokyo tower', 'Torre de Tóquio', ':tokyo_tower:', 'travel'],
  ['🏰', 'Castle', 'Castelo', ':european_castle:', 'travel'],
  ['🏯', 'Japanese castle', 'Castelo japonês', ':japanese_castle:', 'travel'],
  ['🏠', 'House', 'Casa', ':house:', 'travel'],
  ['🏡', 'House with garden', 'Casa com jardim', ':house_with_garden:', 'travel'],
  ['🏢', 'Office building', 'Prédio de escritórios', ':office:', 'travel'],
  ['🏫', 'School', 'Escola', ':school:', 'travel'],
  ['🏨', 'Hotel', 'Hotel', ':hotel:', 'travel'],
  ['🏦', 'Bank', 'Banco', ':bank:', 'travel'],
  ['🏥', 'Hospital', 'Hospital', ':hospital:', 'travel'],
  ['⛪', 'Church', 'Igreja', ':church:', 'travel'],
  ['🕌', 'Mosque', 'Mesquita', ':mosque:', 'travel'],
  ['🌍', 'Globe showing Europe-Africa', 'Globo (Europa-África)', ':earth_africa:', 'travel'],
  ['🌎', 'Globe showing Americas', 'Globo (Américas)', ':earth_americas:', 'travel'],
  ['🌏', 'Globe showing Asia-Australia', 'Globo (Ásia-Oceania)', ':earth_asia:', 'travel'],
  ['🌋', 'Volcano', 'Vulcão', ':volcano:', 'travel'],
  ['🗻', 'Mount fuji', 'Monte Fuji', ':mount_fuji:', 'travel'],
  ['🏕️', 'Camping', 'Acampamento', ':camping:', 'travel'],
  ['🏝️', 'Desert island', 'Ilha deserta', ':desert_island:', 'travel'],
  ['🏜️', 'Desert', 'Deserto', ':desert:', 'travel'],
  ['🏖️', 'Beach with umbrella', 'Praia com guarda-sol', ':beach_with_umbrella:', 'travel'],

  // ── Atividades ─────────────────────────────────────────────────────
  ['⚽', 'Soccer ball', 'Bola de futebol', ':soccer:', 'activity'],
  ['🏀', 'Basketball', 'Basquete', ':basketball:', 'activity'],
  ['🏈', 'American football', 'Futebol americano', ':football:', 'activity'],
  ['⚾', 'Baseball', 'Beisebol', ':baseball:', 'activity'],
  ['🎾', 'Tennis', 'Tênis', ':tennis:', 'activity'],
  ['🎱', 'Billiards', 'Bola de sinuca', ':8ball:', 'activity'],
  ['🏓', 'Ping pong', 'Ping pong', ':ping_pong:', 'activity'],
  ['🏸', 'Badminton', 'Badminton', ':badminton:', 'activity'],
  ['🏐', 'Volleyball', 'Vôlei', ':volleyball:', 'activity'],
  ['🎳', 'Bowling', 'Boliche', ':bowling:', 'activity'],
  ['🥊', 'Boxing glove', 'Luva de boxe', ':boxing_glove:', 'activity'],
  ['🥋', 'Martial arts uniform', 'Kimono de artes marciais', ':martial_arts_uniform:', 'activity'],
  ['⛳', 'Flag in hole', 'Bandeirinha de golfe', ':golf:', 'activity'],
  ['🏄', 'Surfer', 'Surfista', ':surfer:', 'activity'],
  ['🏊', 'Swimmer', 'Nadador', ':swimmer:', 'activity'],
  ['🏇', 'Horse racing', 'Corrida a cavalo', ':horse_racing:', 'activity'],
  ['🚴', 'Bicyclist', 'Ciclista', ':bicyclist:', 'activity'],
  ['🏆', 'Trophy', 'Troféu', ':trophy:', 'activity'],
  ['🥇', '1st place medal', 'Medalha de ouro', ':first_place_medal:', 'activity'],
  ['🥈', '2nd place medal', 'Medalha de prata', ':second_place_medal:', 'activity'],
  ['🥉', '3rd place medal', 'Medalha de bronze', ':third_place_medal:', 'activity'],
  ['🏅', 'Sports medal', 'Medalha esportiva', ':medal_sports:', 'activity'],
  ['🎨', 'Artist palette', 'Paleta de artista', ':art:', 'activity'],
  ['🎬', 'Clapper board', 'Claquete', ':clapper:', 'activity'],
  ['🎤', 'Microphone', 'Microfone', ':microphone:', 'activity'],
  ['🎧', 'Headphone', 'Fone de ouvido', ':headphones:', 'activity'],
  ['🎷', 'Saxophone', 'Saxofone', ':saxophone:', 'activity'],
  ['🎺', 'Trumpet', 'Trompete', ':trumpet:', 'activity'],
  ['🎸', 'Guitar', 'Guitarra', ':guitar:', 'activity'],
  ['🎹', 'Musical keyboard', 'Teclado musical', ':musical_keyboard:', 'activity'],
  ['🥁', 'Drum', 'Bateria', ':drum:', 'activity'],
  ['🎮', 'Video game', 'Videogame', ':video_game:', 'activity'],
  ['🕹️', 'Joystick', 'Joystick', ':joystick:', 'activity'],
  ['🎲', 'Game die', 'Dado', ':game_die:', 'activity'],
  ['♟️', 'Chess pawn', 'Peão de xadrez', ':chess_pawn:', 'activity'],
  ['🎯', 'Direct hit', 'Alvo', ':dart:', 'activity'],
  ['🏹', 'Bow and arrow', 'Arco e flecha', ':bow_and_arrow:', 'activity'],
  ['🎣', 'Fishing pole', 'Vara de pesca', ':fishing_pole_and_fish:', 'activity'],
  ['🎿', 'Skis', 'Esquis', ':ski:', 'activity'],
  ['🎪', 'Circus tent', 'Circo', ':circus_tent:', 'activity'],
  ['🏟️', 'Stadium', 'Estádio', ':stadium:', 'activity'],

  // ── Objetos ────────────────────────────────────────────────────────
  ['💻', 'Laptop', 'Notebook', ':computer:', 'objects'],
  ['🖥️', 'Desktop computer', 'Computador de mesa', ':desktop_computer:', 'objects'],
  ['⌨️', 'Keyboard', 'Teclado', ':keyboard:', 'objects'],
  ['🖱️', 'Computer mouse', 'Mouse', ':computer_mouse:', 'objects'],
  ['🖨️', 'Printer', 'Impressora', ':printer:', 'objects'],
  ['💾', 'Floppy disk', 'Disquete', ':floppy_disk:', 'objects'],
  ['💽', 'Computer disk', 'Disco de computador', ':minidisc:', 'objects'],
  ['📀', 'Optical disc', 'DVD', ':dvd:', 'objects'],
  ['📱', 'Mobile phone', 'Celular', ':iphone:', 'objects'],
  ['📲', 'Mobile phone with arrow', 'Celular com seta', ':calling:', 'objects'],
  ['🧮', 'Abacus', 'Ábaco', ':abacus:', 'objects'],
  ['🔋', 'Battery', 'Bateria', ':battery:', 'objects'],
  ['🔌', 'Electric plug', 'Tomada', ':electric_plug:', 'objects'],
  ['💡', 'Light bulb', 'Lâmpada (ideia)', ':bulb:', 'objects'],
  ['🔦', 'Flashlight', 'Lanterna', ':flashlight:', 'objects'],
  ['📡', 'Satellite antenna', 'Antena parabólica', ':satellite_antenna:', 'objects'],
  ['📻', 'Radio', 'Rádio', ':radio:', 'objects'],
  ['📺', 'Television', 'Televisão', ':tv:', 'objects'],
  ['📷', 'Camera', 'Câmera', ':camera:', 'objects'],
  ['📸', 'Camera with flash', 'Câmera com flash', ':camera_flash:', 'objects'],
  ['📹', 'Video camera', 'Filmadora', ':video_camera:', 'objects'],
  ['🔍', 'Magnifying glass tilted left', 'Lupa para a esquerda', ':mag:', 'objects'],
  ['🔎', 'Magnifying glass tilted right', 'Lupa para a direita', ':mag_right:', 'objects'],
  ['📏', 'Straight ruler', 'Régua', ':straight_ruler:', 'objects'],
  ['📐', 'Triangular ruler', 'Esquadro', ':triangular_ruler:', 'objects'],
  ['✏️', 'Pencil', 'Lápis', ':pencil2:', 'objects'],
  ['✒️', 'Fountain pen nib', 'Bico de pena', ':black_nib:', 'objects'],
  ['🖊️', 'Pen', 'Caneta', ':pen:', 'objects'],
  ['📝', 'Memo', 'Memorando/anotação', ':memo:', 'objects'],
  ['📄', 'Page facing up', 'Página virada para cima', ':page_facing_up:', 'objects'],
  ['📃', 'Page with curl', 'Página enrolada', ':page_with_curl:', 'objects'],
  ['📊', 'Bar chart', 'Gráfico de barras', ':bar_chart:', 'objects'],
  ['📈', 'Chart increasing', 'Gráfico subindo', ':chart_with_upwards_trend:', 'objects'],
  ['📉', 'Chart decreasing', 'Gráfico caindo', ':chart_with_downwards_trend:', 'objects'],
  ['📁', 'File folder', 'Pasta', ':file_folder:', 'objects'],
  ['📂', 'Open file folder', 'Pasta aberta', ':open_file_folder:', 'objects'],
  ['📦', 'Package', 'Pacote', ':package:', 'objects'],
  ['📧', 'E-mail', 'E-mail', ':e-mail:', 'objects'],
  ['📨', 'Incoming envelope', 'Envelope recebido', ':incoming_envelope:', 'objects'],
  ['📩', 'Envelope with arrow', 'Envelope com seta', ':envelope_with_arrow:', 'objects'],
  ['📤', 'Outbox tray', 'Caixa de saída', ':outbox_tray:', 'objects'],
  ['📥', 'Inbox tray', 'Caixa de entrada', ':inbox_tray:', 'objects'],
  ['✉️', 'Envelope', 'Envelope', ':envelope:', 'objects'],
  ['📜', 'Scroll', 'Pergaminho', ':scroll:', 'objects'],
  ['🔖', 'Bookmark', 'Marca-página', ':bookmark:', 'objects'],
  ['🏷️', 'Label', 'Etiqueta', ':label:', 'objects'],
  ['🔗', 'Link', 'Link', ':link:', 'objects'],
  ['📎', 'Paperclip', 'Clipe', ':paperclip:', 'objects'],
  ['🔬', 'Microscope', 'Microscópio', ':microscope:', 'objects'],
  ['🔭', 'Telescope', 'Telescópio', ':telescope:', 'objects'],
  ['🧪', 'Test tube', 'Tubo de ensaio', ':test_tube:', 'objects'],
  ['🧫', 'Petri dish', 'Placa de Petri', ':petri_dish:', 'objects'],
  ['🧬', 'DNA', 'DNA', ':dna:', 'objects'],
  ['🧲', 'Magnet', 'Ímã', ':magnet:', 'objects'],
  ['🛠️', 'Hammer and wrench', 'Martelo e chave inglesa', ':hammer_and_wrench:', 'objects'],
  ['🔧', 'Wrench', 'Chave de boca', ':wrench:', 'objects'],
  ['🔨', 'Hammer', 'Martelo', ':hammer:', 'objects'],
  ['🔑', 'Key', 'Chave', ':key:', 'objects'],
  ['🔒', 'Locked', 'Cadeado fechado', ':lock:', 'objects'],
  ['🔓', 'Unlocked', 'Cadeado aberto', ':unlock:', 'objects'],
  ['🛡️', 'Shield', 'Escudo', ':shield:', 'objects'],
  ['🚪', 'Door', 'Porta', ':door:', 'objects'],
  ['🪑', 'Chair', 'Cadeira', ':chair:', 'objects'],
  ['🛏️', 'Bed', 'Cama', ':bed:', 'objects'],
  ['⏰', 'Alarm clock', 'Despertador', ':alarm_clock:', 'objects'],
  ['⌚', 'Watch', 'Relógio de pulso', ':watch:', 'objects'],
  ['📟', 'Pager', 'Pager', ':pager:', 'objects'],
  ['📞', 'Telephone receiver', 'Telefone', ':phone:', 'objects'],
  ['👑', 'Crown', 'Coroa', ':crown:', 'objects'],
  ['💍', 'Ring', 'Anel', ':ring:', 'objects'],
  ['🕶️', 'Sunglasses', 'Óculos de sol', ':dark_sunglasses:', 'objects'],
  ['💄', 'Lipstick', 'Batom', ':lipstick:', 'objects'],
  ['📿', 'Prayer beads', 'Terço', ':prayer_beads:', 'objects'],

  // ── Símbolos ───────────────────────────────────────────────────────
  ['✅', 'Check mark button', 'Botão de verificação', ':white_check_mark:', 'symbols'],
  ['✔️', 'Check mark', 'Marca de verificação', ':heavy_check_mark:', 'symbols'],
  ['✖️', 'Multiplication sign', 'Sinal de multiplicação', ':heavy_multiplication_x:', 'symbols'],
  ['❌', 'Cross mark', 'X de errado', ':x:', 'symbols'],
  ['➕', 'Plus sign', 'Sinal de mais', ':heavy_plus_sign:', 'symbols'],
  ['➖', 'Minus sign', 'Sinal de menos', ':heavy_minus_sign:', 'symbols'],
  ['❓', 'Question mark', 'Interrogação', ':question:', 'symbols'],
  ['❗', 'Exclamation mark', 'Exclamação', ':exclamation:', 'symbols'],
  ['❕', 'White exclamation', 'Exclamação branca', ':grey_exclamation:', 'symbols'],
  ['🔴', 'Red circle', 'Círculo vermelho', ':red_circle:', 'symbols'],
  ['🟠', 'Orange circle', 'Círculo laranja', ':orange_circle:', 'symbols'],
  ['🟡', 'Yellow circle', 'Círculo amarelo', ':yellow_circle:', 'symbols'],
  ['🟢', 'Green circle', 'Círculo verde', ':green_circle:', 'symbols'],
  ['🔵', 'Blue circle', 'Círculo azul', ':blue_circle:', 'symbols'],
  ['🟣', 'Purple circle', 'Círculo roxo', ':purple_circle:', 'symbols'],
  ['⚫', 'Black circle', 'Círculo preto', ':black_circle:', 'symbols'],
  ['⚪', 'White circle', 'Círculo branco', ':white_circle:', 'symbols'],
  ['🟥', 'Red square', 'Quadrado vermelho', ':red_square:', 'symbols'],
  ['🟧', 'Orange square', 'Quadrado laranja', ':orange_square:', 'symbols'],
  ['🟨', 'Yellow square', 'Quadrado amarelo', ':yellow_square:', 'symbols'],
  ['🟩', 'Green square', 'Quadrado verde', ':green_square:', 'symbols'],
  ['🟦', 'Blue square', 'Quadrado azul', ':blue_square:', 'symbols'],
  ['🟪', 'Purple square', 'Quadrado roxo', ':purple_square:', 'symbols'],
  ['⬛', 'Black large square', 'Quadrado preto', ':black_large_square:', 'symbols'],
  ['⬜', 'White large square', 'Quadrado branco', ':white_large_square:', 'symbols'],
  ['💎', 'Gem stone', 'Pedra preciosa', ':gem:', 'symbols'],
  ['🔷', 'Large blue diamond', 'Diamante azul', ':large_blue_diamond:', 'symbols'],
  ['🔶', 'Large orange diamond', 'Diamante laranja', ':large_orange_diamond:', 'symbols'],
  ['♻️', 'Recycling symbol', 'Símbolo de reciclagem', ':recycle:', 'symbols'],
  ['☮️', 'Peace symbol', 'Símbolo da paz', ':peace_symbol:', 'symbols'],
  ['☯️', 'Yin yang', 'Yin-yang', ':yin_yang:', 'symbols'],
  ['⚛️', 'Atom symbol', 'Símbolo do átomo', ':atom_symbol:', 'symbols'],
  ['☢️', 'Radioactive', 'Radioativo', ':radioactive_sign:', 'symbols'],
  ['☣️', 'Biohazard', 'Perigo biológico', ':biohazard:', 'symbols'],
  ['⚠️', 'Warning', 'Aviso', ':warning:', 'symbols'],
  ['🚫', 'Prohibited', 'Proibido', ':prohibited:', 'symbols'],
  ['⛔', 'No entry', 'Entrada proibida', ':no_entry:', 'symbols'],
  ['🚭', 'No smoking', 'Proibido fumar', ':no_smoking:', 'symbols'],
  ['🔞', 'No one under eighteen', 'Proibido menores de 18', ':underage:', 'symbols'],
  ['♈', 'Aries', 'Áries', ':aries:', 'symbols'],
  ['♉', 'Taurus', 'Touro', ':taurus:', 'symbols'],
  ['♊', 'Gemini', 'Gêmeos', ':gemini:', 'symbols'],
  ['♋', 'Cancer', 'Câncer', ':cancer:', 'symbols'],
  ['♌', 'Leo', 'Leão (signo)', ':leo:', 'symbols'],
  ['♍', 'Virgo', 'Virgem', ':virgo:', 'symbols'],
  ['♎', 'Libra', 'Libra', ':libra:', 'symbols'],
  ['♏', 'Scorpio', 'Escorpião', ':scorpio:', 'symbols'],
  ['♐', 'Sagittarius', 'Sagitário', ':sagittarius:', 'symbols'],
  ['♑', 'Capricorn', 'Capricórnio', ':capricorn:', 'symbols'],
  ['♒', 'Aquarius', 'Aquário', ':aquarius:', 'symbols'],
  ['♓', 'Pisces', 'Peixes', ':pisces:', 'symbols'],
  ['♾️', 'Infinity', 'Infinito', ':infinity:', 'symbols'],
  ['⚜️', 'Fleur-de-lis', 'Flor de lis', ':fleur_de_lis:', 'symbols'],
  ['🔱', 'Trident emblem', 'Emblema de tridente', ':trident:', 'symbols'],
  ['⏳', 'Hourglass', 'Ampulheta', ':hourglass:', 'symbols'],
  ['⌛', 'Hourglass done', 'Ampulheta esgotada', ':hourglass_flowing_sand:', 'symbols'],
  ['⏱️', 'Stopwatch', 'Cronômetro', ':stopwatch:', 'symbols'],
  ['⏲️', 'Timer clock', 'Temporizador', ':timer_clock:', 'symbols'],
  ['🕛', 'Twelve o’clock', 'Meio-dia', ':clock12:', 'symbols'],
  ['🕐', 'One o’clock', 'Uma hora', ':clock1:', 'symbols'],
  ['🕒', 'Three o’clock', 'Três horas', ':clock3:', 'symbols'],
  ['🕕', 'Six o’clock', 'Seis horas', ':clock6:', 'symbols'],
  ['🕘', 'Nine o’clock', 'Nove horas', ':clock9:', 'symbols'],
  ['🆔', 'ID button', 'Botão ID', ':id:', 'symbols'],
  ['📶', 'Antenna bars', 'Barras de sinal', ':signal_strength:', 'symbols'],
  ['🔊', 'Speaker high volume', 'Volume alto', ':loud_sound:', 'symbols'],
  ['🔕', 'Bell with slash', 'Sino cortado', ':no_bell:', 'symbols'],
  ['🎵', 'Musical note', 'Nota musical', ':musical_note:', 'symbols'],
  ['🎶', 'Musical notes', 'Notas musicais', ':notes:', 'symbols'],
  ['🎼', 'Musical score', 'Partitura', ':musical_score:', 'symbols'],

  // ── Bandeiras ──────────────────────────────────────────────────────
  ['🇧🇷', 'Flag: Brazil', 'Bandeira do Brasil', ':flag-br:', 'flags'],
  ['🇺🇸', 'Flag: United States', 'Bandeira dos EUA', ':flag-us:', 'flags'],
  ['🇬🇧', 'Flag: United Kingdom', 'Bandeira do Reino Unido', ':flag-gb:', 'flags'],
  ['🇪🇸', 'Flag: Spain', 'Bandeira da Espanha', ':flag-es:', 'flags'],
  ['🇫🇷', 'Flag: France', 'Bandeira da França', ':flag-fr:', 'flags'],
  ['🇩🇪', 'Flag: Germany', 'Bandeira da Alemanha', ':flag-de:', 'flags'],
  ['🇮🇹', 'Flag: Italy', 'Bandeira da Itália', ':flag-it:', 'flags'],
  ['🇯🇵', 'Flag: Japan', 'Bandeira do Japão', ':flag-jp:', 'flags'],
  ['🇨🇳', 'Flag: China', 'Bandeira da China', ':flag-cn:', 'flags'],
  ['🇮🇳', 'Flag: India', 'Bandeira da Índia', ':flag-in:', 'flags'],
  ['🇨🇦', 'Flag: Canada', 'Bandeira do Canadá', ':flag-ca:', 'flags'],
  ['🇦🇷', 'Flag: Argentina', 'Bandeira da Argentina', ':flag-ar:', 'flags'],
  ['🇲🇽', 'Flag: Mexico', 'Bandeira do México', ':flag-mx:', 'flags'],
  ['🇵🇹', 'Flag: Portugal', 'Bandeira de Portugal', ':flag-pt:', 'flags'],
  ['🚩', 'Triangular flag', 'Bandeira triangular', ':triangular_flag_on_post:', 'flags'],
  ['🎌', 'Crossed flags', 'Bandeiras cruzadas', ':crossed_flags:', 'flags'],
  ['🏳️', 'White flag', 'Bandeira branca', ':white_flag:', 'flags'],
  ['🏴', 'Black flag', 'Bandeira preta', ':black_flag:', 'flags'],
]

// Código-fonte exibido no Collapse — só texto, sem template literals com ${}.
const SOURCE = [
  '// Cada item é uma tupla [emoji, nomeEn, nomePt, shortcode, categoria].',
  '// Filtro: casa categoria, nome PT/EN, shortcode OU o próprio emoji.',
  'function matches(it, q, catLabel) {',
  "  const sc = it[3] || ''            // shortcode GitHub ou vazio",
  "  const texto = (it[1] + ' ' + it[2] + ' ' + sc + ' ' + it[0] + ' ' + catLabel(it[4])).toLowerCase()",
  "  return q.split(' ').every((w) => texto.includes(w))",
  '}',
  '',
  '// Ordem alfabética por nome EN dentro de cada categoria:',
  'for (const cat of CATEGORIES) {',
  '  byCategory[cat.key].sort((a, b) => a[1].localeCompare(b[1]))',
  '}',
].join('\n')

const translations = {
  pt: {
    title: 'Cheat Sheet de Emojis',
    intro: (
      <>
        Coleção pesquisável e bilíngue dos emojis mais usados em dev: commit, doc,
        código e issue. Cada card mostra o emoji, o nome (PT/EN) e o{' '}
        <Text code>:shortcode:</Text> do GitHub — clique no emoji para copiá-lo e
        no shortcode para copiar <Text code>:rocket:</Text> direto pra sua doc.
      </>
    ),
    search: 'Buscar por nome, shortcode (ex.: :rocket:) ou até pelo próprio emoji…',
    all: 'Todas',
    counts: (n) => `${n} emojis exibidos`,
    copyEmojiHint: 'Clique no emoji para copiar',
    copyScHint: 'Clique para copiar o shortcode',
    copiedEmoji: 'Emoji copiado!',
    copiedSc: 'Shortcode copiado!',
    copyErr: 'Não foi possível copiar',
    copyMarkdown: 'Copiar filtrados (Markdown)',
    copyMarkdownDone: 'Lista Markdown copiada!',
    empty: 'Nenhum emoji com esse filtro.',
    tipTitle: 'Sobre os shortcodes de GitHub',
    tipBody: (
      <>
        Em Markdown do GitHub, issues, PRs e comentários, escrever{' '}
        <Text code>:rocket:</Text> vira 🚀 — o shortcode funciona até em{' '}
        <Text code>git commit</Text> se a mensagem estiver no GitHub. Nem todo emoji
        tem shortcode oficial (só a lista do{' '}
        <Text code>gemoji</Text>); para os demais, o emoji em si sempre funciona.
        A aparência muda de sistema pra sistema: cada OS renderiza seu próprio
        font de emoji.
      </>
    ),
    sourceTab: 'Filtro & agrupamento (código)',
    sourceHint: 'O núcleo da página:',
    cat: 'Categoria',
  },
  en: {
    title: 'Emoji Cheat Sheet',
    intro: (
      <>
        Searchable, bilingual collection of the emojis you actually use in dev —
        commit, docs, code and issues. Each card shows the emoji, the name (PT/EN)
        and the GitHub <Text code>:shortcode:</Text> — click the emoji to copy it
        and the shortcode to copy <Text code>:rocket:</Text> right into a doc.
      </>
    ),
    search: 'Search by name, shortcode (e.g. :rocket:) or even the emoji itself…',
    all: 'All',
    counts: (n) => `${n} emojis shown`,
    copyEmojiHint: 'Click the emoji to copy',
    copyScHint: 'Click to copy the shortcode',
    copiedEmoji: 'Emoji copied!',
    copiedSc: 'Shortcode copied!',
    copyErr: 'Could not copy',
    copyMarkdown: 'Copy filtered (Markdown)',
    copyMarkdownDone: 'Markdown list copied!',
    empty: 'No emoji matches this filter.',
    tipTitle: 'About GitHub shortcodes',
    tipBody: (
      <>
        In GitHub Markdown, issues, PRs and comments, typing{' '}
        <Text code>:rocket:</Text> renders as 🚀 — the shortcode even works in{' '}
        <Text code>git commit</Text> once the message lands on GitHub. Not every
        emoji has an official shortcode (only the <Text code>gemoji</Text> set
        does); for the rest, the emoji itself always works. Rendering varies by
        OS — each platform ships its own emoji font.
      </>
    ),
    sourceTab: 'Filter & grouping (code)',
    sourceHint: 'The core of the page:',
    cat: 'Category',
  },
}

export default function EmojiCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')

  const catLabel = useCallback(
    (key) => {
      const c = CATEGORIES.find((x) => x.key === key)
      return c ? c[lang] : key
    },
    [lang]
  )

  // Normaliza e memoriza os itens por categoria para uso na ordenação.
  const byCategory = useMemo(() => {
    const map = {}
    for (const key of CATEGORIES.map((c) => c.key)) map[key] = []
    for (const it of DATA) (map[it[4]] || []).push(it)
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a[1].localeCompare(b[1]))
    }
    return map
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return byCategory[cat] !== undefined
      ? byCategory[cat].filter((it) => {
          if (!q) return true
          const text = `${it[1]} ${it[2]} ${it[3] || ''} ${it[0]} ${it[4]}`.toLowerCase()
          return q.split(/\s+/).every((w) => text.includes(w))
        })
      : Object.values(byCategory).flat().filter((it) => {
          if (!q) return true
          const text = `${it[1]} ${it[2]} ${it[3] || ''} ${it[0]} ${it[4]}`.toLowerCase()
          return q.split(/\s+/).every((w) => text.includes(w))
        })
  }, [byCategory, query, cat])

  const countByCat = useMemo(() => {
    const c = {}
    for (const it of DATA) c[it[4]] = (c[it[4]] || 0) + 1
    return c
  }, [])

  function copyText(text, msg) {
    navigator.clipboard.writeText(text)
      .then(() => message.success(msg))
      .catch(() => message.error(t.copyErr))
  }

  function copyMarkdown() {
    const lines = filtered.map((it) => {
      const name = lang === 'pt' ? it[2] : it[1]
      return it[3] ? `- ${it[3]} ${name} (${it[0]})` : `- ${name} (${it[0]})`
    })
    copyText(lines.join('\n'), t.copyMarkdownDone)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<ThunderboltOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder={t.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Radio.Group value={cat} onChange={(e) => setCat(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({DATA.length})</Radio.Button>
          {CATEGORIES.map((c) => (
            <Radio.Button key={c.key} value={c.key}>
              {c[lang]} ({countByCat[c.key] || 0})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">{t.counts(filtered.length)}</Text>
        <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown} disabled={filtered.length === 0}>
          {t.copyMarkdown}
        </Button>
      </Space>

      {filtered.length === 0 ? (
        <Text type="secondary">{t.empty}</Text>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 10,
          }}
        >
          {filtered.map((it) => (
            <div
              key={it[0] + it[1]}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                transition: 'border-color .2s, box-shadow .2s',
              }}
              onClick={() => copyText(it[0], t.copiedEmoji)}
              title={t.copyEmojiHint}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{it[0]}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <Text style={{ display: 'block', fontSize: 13, lineHeight: 1.3 }}>{lang === 'pt' ? it[2] : it[1]}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {lang === 'pt' ? it[1] : it[2]}
                </Text>
              </span>
              {it[3] && (
                <Tooltip title={t.copyScHint}>
                  <Tag
                    color="blue"
                    style={{ marginInlineEnd: 0, fontSize: 11, cursor: 'copy', fontFamily: 'monospace' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      copyText(it[3], t.copiedSc)
                    }}
                  >
                    {it[3]}
                  </Tag>
                </Tooltip>
              )}
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
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}