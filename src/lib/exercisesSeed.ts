import { db } from './db';
import type { Exercise, Routine, RoutineExercise, WorkoutSession, SessionSet, BodyMetrics } from '@/types/database';

const BACKUP_EXERCISES = [
  { id: 1, nome: "Supino Reto com Barra", categoria: "Peito", ajuda: "Monte um arco confortável, faça uma pausa rápida no peito e exploda na subida em cada repetição", video_url: "https://youtu.be/vcBig73ojpE?t=134", sub1: 36, sub2: 37 },
  { id: 2, nome: "Larsen Press", categoria: "Peito", ajuda: "Escápulas retraídas e deprimidas. Leve arco na parte superior das costas. Zero leg drive.", video_url: "https://youtu.be/RQjPWrMMDqQ", sub1: 38, sub2: 39 },
  { id: 3, nome: "Desenvolvimento Arnold em Pé com Halteres", categoria: "Ombros", ajuda: "Comece com cotovelos à frente do corpo e palmas voltadas para dentro. Gire os halteres enquanto empurra até as palmas ficarem para frente.", video_url: "https://www.youtube.com/watch?v=zOpA1Op0zvc", sub1: 40, sub2: 30 },
  { id: 4, nome: "A1. Press-Around", categoria: "Peito", ajuda: "Estabilize com o braço que não trabalha e contraia o peitoral pressionando o cabo cruzando o corpo.", video_url: "https://youtu.be/NsEbXsTwas8?t=483", sub1: 41, sub2: 42 },
  { id: 5, nome: "A2. Alongamento Estático de Peitoral — 30s", categoria: "Peito", ajuda: "Segure o alongamento do peitoral por 30 segundos com intensidade aproximada de 7/10.", video_url: "", sub1: 0, sub2: 0 },
  { id: 8, nome: "Extensão de Tríceps Cruzada N1-Style", categoria: "Peito", ajuda: "Estenda o tríceps com o braço mais aberto lateralmente que no pressdown tradicional. Sinta o alongamento enquanto o cabo cruza o tronco.", video_url: "", sub1: 0, sub2: 0 },
  { id: 9, nome: "Puxada Alta (Séries Preparatórias)", categoria: "Costas", ajuda: "Faça 4 séries preparatórias de 10 reps aumentando gradualmente o peso. Série 1: leve (RPE 4-5). Série 2: (RPE 6-7). Série 3: (RPE 7-8). Série 4: série difícil, tente falhar na 10ª repetição.", video_url: "https://youtu.be/O94yEoGXtBY?t=150", sub1: 10, sub2: 11 },
  { id: 10, nome: "Puxada Máquina", categoria: "Costas", ajuda: "", video_url: "", sub1: 9, sub2: 11 },
  { id: 11, nome: "Barra Fixa", categoria: "Costas", ajuda: "", video_url: "", sub1: 9, sub2: 10 },
  { id: 12, nome: "Puxada Alta (Série até a Falha)", categoria: "Costas", ajuda: "Após falhar em ~10 reps, faça um dropset. Reduza o peso em ~30-50% e faça mais 5 reps com técnica controlada.", video_url: "https://youtu.be/O94yEoGXtBY?t=150", sub1: 10, sub2: 11 },
  { id: 13, nome: "Remada Máquina Apoio de Peito (Pegadas Variadas)", categoria: "Costas", ajuda: "Use 3 pegadas diferentes para as 3 séries (idealmente indo da mais aberta para a mais fechada).", video_url: "https://youtu.be/w2YTOoDBOZg", sub1: 14, sub2: 15 },
  { id: 14, nome: "Remada Inclinada com Halteres", categoria: "Costas", ajuda: "", video_url: "", sub1: 13, sub2: 15 },
  { id: 15, nome: "Remada Baixa na Polia", categoria: "Costas", ajuda: "", video_url: "", sub1: 13, sub2: 14 },
  { id: 16, nome: "A1. Pullover Halter Metade Inferior", categoria: "Costas", ajuda: "Faça o pullover, mas corte a metade superior da ADM (fique inteiramente na fase de alongamento do movimento).", video_url: "https://youtu.be/blJj6xxOJQs", sub1: 17, sub2: 18 },
  { id: 17, nome: "Pullover na Polia", categoria: "Costas", ajuda: "", video_url: "", sub1: 16, sub2: 18 },
  { id: 18, nome: "Puxada Unilateral Fechada na Polia", categoria: "Costas", ajuda: "", video_url: "", sub1: 16, sub2: 17 },
  { id: 19, nome: "A2. Alongamento Estático de Dorsal 30s", categoria: "Costas", ajuda: "Mantenha o alongamento de dorsal por 30 segundos. A intensidade deve ser de cerca de 7/10.", video_url: "https://youtu.be/gxD9coWulU0", sub1: 0, sub2: 0 },
  { id: 20, nome: "Face Pull (Direções Variadas)", categoria: "Ombros", ajuda: "1ª série: de baixo para cima. 2ª série: altura média. 3ª série: de cima para baixo.", video_url: "https://youtu.be/uoWXumFUeCc", sub1: 21, sub2: 22 },
  { id: 21, nome: "Crucifixo Inverso na Polia", categoria: "Costas", ajuda: "", video_url: "", sub1: 20, sub2: 22 },
  { id: 22, nome: "Crucifixo Inverso Curvado com Halteres", categoria: "Costas", ajuda: "", video_url: "", sub1: 20, sub2: 21 },
  { id: 23, nome: "Rosca Direta com Barra W", categoria: "Braços", ajuda: "Foco em contrair os bíceps, minimize o impulso com o tronco.", video_url: "https://www.youtube.com/watch?v=Dd0t5UOCEUc", sub1: 24, sub2: 25 },
  { id: 24, nome: "Rosca com Halteres", categoria: "Braços", ajuda: "", video_url: "", sub1: 23, sub2: 25 },
  { id: 25, nome: "Rosca na Polia", categoria: "Braços", ajuda: "", video_url: "", sub1: 23, sub2: 24 },
  { id: 26, nome: "Rosca Scott Metade Inferior", categoria: "Braços", ajuda: "Faça a rosca, mas corte a metade superior da ADM (fique inteiramente na fase de alongamento do movimento).", video_url: "https://youtu.be/hAELX8JE9uw", sub1: 0, sub2: 0 },
  { id: 27, nome: "Rosca Spider Metade Inferior", categoria: "Braços", ajuda: "", video_url: "", sub1: 26, sub2: 0 },
  { id: 28, nome: "Rosca Bayesiana Metade Inferior", categoria: "Braços", ajuda: "", video_url: "", sub1: 26, sub2: 27 },
  { id: 29, nome: "Supino Inclinado Fechado com Barra", categoria: "Peito", ajuda: "Use uma inclinação de ~45° e uma pegada um pouco mais larga que a largura dos ombros.", video_url: "https://youtu.be/0P4Ep0SBW5Q", sub1: 80, sub2: 98 },
  { id: 30, nome: "Desenvolvimento Máquina", categoria: "Ombros", ajuda: "Não pare entre as reps, mantenha uma tensão suave e controlada nos deltoides.", video_url: "https://www.youtube.com/watch?v=flr4ohSl0j8", sub1: 81, sub2: 3 },
  { id: 31, nome: "Tríceps Testa no Chão (Pesado)", categoria: "Braços", ajuda: "Faça um arco com a barra atrás da cabeça, deixe a barra parar completamente no chão entre as reps.", video_url: "https://youtu.be/popGXI-qs98?t=153", sub1: 82, sub2: 99 },
  { id: 32, nome: "Crucifixo no Cabo Curvado", categoria: "Peito", ajuda: "Contraia os peitorais juntos no topo e sinta um grande alongamento na parte inferior.", video_url: "https://youtu.be/hByv_OUpoug", sub1: 83, sub2: 41 },
  { id: 33, nome: "Elevação Lateral Polia (Foco Excêntrico + Tensão Constante)", categoria: "Ombros", ajuda: "Primeiras 5 reps: descida de 5 segundos. Últimas 15 reps: tension constant (sem pausa embaixo ou em cima).", video_url: "https://youtu.be/DZiL8AEQq1U", sub1: 45, sub2: 46 },
  { id: 34, nome: "Elevação Frontal com Anilha", categoria: "Ombros", ajuda: "Gire um lado para cima como um volante de carro ao levantar a anilha.", video_url: "https://youtu.be/mDl8rByUKmc", sub1: 84, sub2: 100 },
  { id: 35, nome: "Flexão Diamante", categoria: "Peito", ajuda: "Junte as mãos no chão formando um diamante e faça o máximo de repetições possível (AMRAP) com um ritmo suave.", video_url: "https://youtu.be/3RprT_9LAZg", sub1: 85, sub2: 101 },
  { id: 36, nome: "Supino com Halteres", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 37, nome: "Supino Máquina", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 38, nome: "Supino com Halteres (Sem Leg Drive)", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 39, nome: "Supino Máquina (Sem Leg Drive)", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 40, nome: "Desenvolvimento Sentado com Halteres", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 41, nome: "Crucifixo com Halteres", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 42, nome: "Flexão com Déficit", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 43, nome: "A2. Alongamento Estático de Peitoral 30s", categoria: "Peito", ajuda: "Mantenha o alongamento do peitoral por 30 segundos. A intensidade deve ser de cerca de 7/10.", video_url: "", sub1: 0, sub2: 0 },
  { id: 44, nome: "Elevação em Y Cabo Cruzado", categoria: "Ombros", ajuda: "Pense em puxar o cabo para fora e para cima como se estivesse \"desembainhando uma espada\" da sua cintura.", video_url: "https://youtu.be/Jt2hV6dCbmE", sub1: 45, sub2: 46 },
  { id: 45, nome: "Elevação Lateral com Halteres", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 46, nome: "Elevação Lateral Máquina", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 47, nome: "Tríceps Pulley Apenas Contração + Tríceps Francês Apenas Alongamento", categoria: "Braços", ajuda: "Faça a 2ª metade da ADM (Amplitude de Movimento) no pulley (\"contração\") e a 1ª metade da ADM no tríceps francês (\"alongamento\").", video_url: "https://youtu.be/M9k0RcOQKOo", sub1: 48, sub2: 49 },
  { id: 48, nome: "Tríceps Pulley (12-15 reps)", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 49, nome: "Tríceps Testa com Halter (12-15 reps)", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 50, nome: "Extensão de Tríceps Cruzada (Estilo N1)", categoria: "Ombros", ajuda: "Estenda o tríceps com o braço mais para o lado do que em um pulley normal. Sinta o alongamento enquanto o cabo cruza o tronco.", video_url: "https://youtu.be/tkCXYakxafs", sub1: 51, sub2: 52 },
  { id: 51, nome: "Tríceps Pulley Unilateral", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 52, nome: "Tríceps Coice Unilateral na Polia", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 53, nome: "Agachamento Livre", categoria: "Pernas", ajuda: "Jogue o quadril para trás e para baixo, mantenha a parte superior das costas firme contra a barra.", video_url: "https://youtu.be/bEv6CCg2BC8?t=147", sub1: 0, sub2: 0 },
  { id: 54, nome: "Agachamento Hack", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 55, nome: "Agachamento Búlgaro com Halteres", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 56, nome: "Agachamento com Pausa (Série de Redução)", categoria: "Pernas", ajuda: "Reduza o peso em ~25% da sua série mais pesada. Pausa de 2s. Jogue o quadril para trás/baixo, costas firmes na barra.", video_url: "https://youtu.be/1Rd1QgA46hQ", sub1: 75, sub2: 95 },
  { id: 57, nome: "RDL com Barra (Stiff)", categoria: "Pernas", ajuda: "Mantenha a lombar neutra, jogue os quadris para trás, não deixe a coluna curvar.", video_url: "https://youtu.be/_oyxCn2iSjU?t=95", sub1: 76, sub2: 96 },
  { id: 58, nome: "Passada (Afundo Caminhando)", categoria: "Pernas", ajuda: "Dê passos médios, minimize a força de impulso da perna de trás.", video_url: "https://youtu.be/Y4Vv2ASsyhs?t=536", sub1: 77, sub2: 0 },
  { id: 59, nome: "Cadeira Flexora", categoria: "Pernas", ajuda: "Foco em contrair os isquiotibiais para mover o peso.", video_url: "https://youtu.be/2CMmuH4qJh0", sub1: 78, sub2: 92 },
  { id: 60, nome: "Panturrilha no Leg Press", categoria: "Pernas", ajuda: "Empurre até a ponta dos dedos, alongue as panturrilhas na parte inferior, não deixe a lombar curvar.", video_url: "https://youtu.be/VJ_9xii47Sk", sub1: 73, sub2: 93 },
  { id: 61, nome: "Abdominal Declinado com Anilha", categoria: "Core", ajuda: "Segure uma anilha ou halter no peito e contraia forte!", video_url: "https://youtu.be/Aos574-Brzw", sub1: 79, sub2: 97 },
  { id: 62, nome: "Puxada Unilateral Semi-Ajoelhada", categoria: "Costas", ajuda: "Peito estufado, cotovelo rente ao tronco, foco em contrair o dorsal para mover o peso.", video_url: "https://youtu.be/B0W4DQeo1tE", sub1: 18, sub2: 17 },
  { id: 63, nome: "Barra Fixa (1 Série AMRAP)", categoria: "Costas", ajuda: "Pegada 1,5x a largura dos ombros, puxe o peito em direção à barra. (AMRAP = Máximo de reps).", video_url: "https://youtu.be/Hdc7Mw6BIEE?t=99", sub1: 86, sub2: 10 },
  { id: 64, nome: "Remada Kroc", categoria: "Costas", ajuda: "Remadas Kroc são remadas com halter com uma leve \"roubada\" e postura mais ereta. Pode pegar pesado e usar straps.", video_url: "https://youtu.be/nD0KoWhnTks", sub1: 87, sub2: 102 },
  { id: 65, nome: "Encolhimento na Polia Cruzada", categoria: "Costas", ajuda: "Coloque dois puxadores na polia baixa e encolha para cima e para dentro. Contraia os trapézios superiores.", video_url: "https://youtu.be/C6sYjDFuq9I?t=354", sub1: 88, sub2: 103 },
  { id: 66, nome: "Voador Inverso (Peck Deck Inverso)", categoria: "Costas", ajuda: "Jogue o peso para \"fora\", não para \"trás\".", video_url: "https://youtu.be/qfc70k40318?t=259", sub1: 21, sub2: 104 },
  { id: 67, nome: "Rosca Bíceps Cruzada na Polia (Estilo N1)", categoria: "Braços", ajuda: "Puxe cruzando o corpo com o braço estendido para o lado a ~60°.", video_url: "https://youtu.be/sMDDIbzPhvY", sub1: 89, sub2: 24 },
  { id: 68, nome: "Levantamento Terra", categoria: "Costas", ajuda: "Trave os dorsais, peito estufado, tire a folga da barra antes de levantar.", video_url: "https://youtu.be/VL5Ab0T07e4?t=175", sub1: 90, sub2: 105 },
  { id: 69, nome: "Stiff (Levantamento Terra Pernas Estendidas)", categoria: "Pernas", ajuda: "Pense em fazer um terra convencional com o quadril alto e leve flexão nos joelhos.", video_url: "https://youtu.be/EbDSWqgmcA0", sub1: 57, sub2: 76 },
  { id: 70, nome: "Leg Press", categoria: "Pernas", ajuda: "Posicionamento médio dos pés na plataforma, não deixe a lombar curvar.", video_url: "https://youtu.be/didU4ZwAkPI?t=241", sub1: 91, sub2: 58 },
  { id: 71, nome: "Elevação Glúteo-Posterior (GHR)", categoria: "Pernas", ajuda: "Mantenha o quadril reto, faça flexão nórdica se não houver máquina de GHR.", video_url: "https://youtu.be/psdbgvbdd_M", sub1: 92, sub2: 78 },
  { id: 72, nome: "Cadeira Extensora (Excêntrica Lenta)", categoria: "Pernas", ajuda: "Controle o peso com uma descida (fase negativa) de 3-4 segundos.", video_url: "https://youtu.be/tk45ov08d_A", sub1: 77, sub2: 91 },
  { id: 73, nome: "Panturrilha Sentado (Máquina)", categoria: "Pernas", ajuda: "Empurre até a ponta dos dedos, alongue as panturrilhas na parte inferior, não dê solavancos.", video_url: "https://youtu.be/-qsRtp_PbVM?t=311", sub1: 93, sub2: 60 },
  { id: 74, nome: "Elevação de Pernas na Cadeira Romana", categoria: "Core", ajuda: "Não balance as pernas, minimize o impulso. Dobre os joelhos para o peito se pernas retas for muito difícil.", video_url: "https://youtu.be/dd1WoEcQB4c", sub1: 94, sub2: 106 },
  { id: 75, nome: "Agachamento Hack com Pausa", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 76, nome: "RDL com Halteres", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 77, nome: "Subida no Banco (Step-up)", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 78, nome: "Mesa Flexora", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 79, nome: "Abdominal na Polia", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 80, nome: "Supino Inclinado Fechado Halter", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 81, nome: "Desenvolvimento Sentado Halter", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 82, nome: "Tríceps Testa no Chão com Halter", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 83, nome: "Voador (Peck Deck)", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 84, nome: "Elevação Frontal with Halteres", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 85, nome: "Flexão Fechada", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 86, nome: "Puxada Alta (AMRAP 8-15 reps)", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 87, nome: "Remada Unilateral com Halter", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 88, nome: "Encolhimento with Halteres", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 89, nome: "Rosca no Banco Inclinado", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 90, nome: "Terra com Trap Bar (Hexagonal)", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 91, nome: "Agachamento Goblet", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 92, nome: "Flexão Nórdica", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 93, nome: "Panturrilha em Pé", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 94, nome: "Elevação de Pernas Suspenso", categoria: "Core", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 95, nome: "Agachamento Búlgaro com Pausa", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 96, nome: "Hiperextensão 45°", categoria: "Pernas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 97, nome: "Abdominal Máquina", categoria: "Core", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 98, nome: "Supino Máquina Fechado", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 99, nome: "Tríceps Francês na Polia", categoria: "Braços", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 100, nome: "Elevação Frontal na Polia", categoria: "Ombros", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 101, nome: "Flexão Apoiada nos Joelhos", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 102, nome: "Remada Meadows", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 103, nome: "Encolhimento com Anilha", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 104, nome: "Crucifixo Inverso Curvado Halter", categoria: "Peito", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 105, nome: "Elevação Pélvica with Barra", categoria: "Costas", ajuda: "", video_url: "", sub1: 0, sub2: 0 },
  { id: 106, nome: "Abdominal Reverso", categoria: "Core", ajuda: "", video_url: "", sub1: 0, sub2: 0 }
];

const BACKUP_ROUTINES = [
  { 
    id: 6, 
    nome: "Push 1", 
    days: [1], 
    exercicios: [
      { id: 1, w: 2, s: 1, r: "3-5", d: 180 },
      { id: 2, w: 0, s: 2, r: "10", d: 180 },
      { id: 3, w: 1, s: 3, r: "8-10", d: 120 },
      { id: 4, w: 1, s: 2, r: "12-15", d: 1 },
      { id: 43, w: 0, s: 2, r: "30", d: 1 },
      { id: 44, w: 1, s: 2, r: "12-15", d: 90 },
      { id: 47, w: 1, s: 2, r: "8+8", d: 90 },
      { id: 50, w: 0, s: 1, r: "10-12", d: 90 }
    ]
  },
  { 
    id: 7, 
    nome: "Pull 1", 
    days: [2],
    exercicios: [
      { id: 9, w: 0, s: 3, r: "10", d: 120 },
      { id: 12, w: 0, s: 1, r: "10+5", d: 120 },
      { id: 13, w: 1, s: 3, r: "10-12", d: 120 },
      { id: 16, w: 1, s: 2, r: "10-12", d: 1 },
      { id: 19, w: 0, s: 2, r: "30", d: 1 },
      { id: 20, w: 0, s: 3, r: "12-15", d: 90 },
      { id: 23, w: 1, s: 2, r: "6-8", d: 90 },
      { id: 26, w: 0, s: 2, r: "10-12", d: 90 }
    ]
  },
  { 
    id: 8, 
    nome: "Legs 1", 
    days: [3],
    exercicios: [
      { id: 53, w: 2, s: 1, r: "2-4", d: 180 },
      { id: 56, w: 0, s: 1, r: "5", d: 180 },
      { id: 57, w: 1, s: 3, r: "8-10", d: 120 },
      { id: 58, w: 1, s: 2, r: "10", d: 120 },
      { id: 59, w: 1, s: 2, r: "10-12", d: 90 },
      { id: 60, w: 1, s: 3, r: "10-12", d: 90 },
      { id: 61, w: 1, s: 2, r: "10-12", d: 90 }
    ]
  },
  { 
    id: 9, 
    nome: "Push 2", 
    days: [4],
    exercicios: [
      { id: 29, w: 1, s: 3, r: "8,5,12", d: 180 },
      { id: 30, w: 1, s: 3, r: "10-12", d: 120 },
      { id: 31, w: 1, s: 2, r: "6-8", d: 90 },
      { id: 32, w: 1, s: 2, r: "10-12", d: 90 },
      { id: 33, w: 1, s: 2, r: "5,15", d: 90 },
      { id: 34, w: 1, s: 2, r: "15-20", d: 90 },
      { id: 35, w: 0, s: 1, r: "FALHA", d: 1 }
    ]
  },
  { 
    id: 10, 
    nome: "Pull 2", 
    days: [5],
    exercicios: [
      { id: 62, w: 1, s: 2, r: "12-15", d: 90 },
      { id: 63, w: 1, s: 1, r: "FALHA", d: 120 },
      { id: 64, w: 1, s: 3, r: "10-12", d: 120 },
      { id: 65, w: 1, s: 2, r: "10-12", d: 90 },
      { id: 66, w: 1, s: 2, r: "10-12", d: 90 },
      { id: 67, w: 1, s: 2, r: "10-12", d: 90 }
    ]
  },
  { 
    id: 11, 
    nome: "Legs 2", 
    days: [6],
    exercicios: [
      { id: 68, w: 2, s: 1, r: "5", d: 180 },
      { id: 69, w: 0, s: 2, r: "8", d: 180 },
      { id: 70, w: 1, s: 3, r: "10-12", d: 120 },
      { id: 71, w: 1, s: 2, r: "8-10", d: 90 },
      { id: 72, w: 1, s: 2, r: "8-10", d: 90 },
      { id: 73, w: 1, s: 3, r: "15-20", d: 90 },
      { id: 74, w: 1, s: 2, r: "10-20", d: 90 }
    ]
  }
];

const BACKUP_SESSIONS = [
  { id: 1, rid: 4, start: "2026-04-29T21:29:54.382Z", end: "2026-04-29T22:22:06.464Z", exercises: [
    { eid: 9, sets: [{ t: 'work', kg: 26, r: 10, rpe: 3 }, { t: 'work', kg: 33, r: 10, rpe: 5 }, { t: 'work', kg: 40, r: 10, rpe: 7 }, { t: 'work', kg: 47, r: 10, rpe: 8 }] },
    { eid: 12, sets: [{ t: 'work', kg: 54, r: 15, rpe: 10 }] },
    { eid: 13, sets: [{ t: 'warmup', kg: 33, r: 12, rpe: 5 }, { t: 'warmup', kg: 47, r: 12, rpe: 7 }, { t: 'work', kg: 54, r: 12, rpe: 8 }, { t: 'work', kg: 61, r: 12, rpe: 9 }, { t: 'work', kg: 72, r: 12, rpe: 9 }] },
    { eid: 16, sets: [{ t: 'warmup', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }] },
    { eid: 19, sets: [{ t: 'work', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }] },
    { eid: 23, sets: [{ t: 'warmup', kg: 10, r: 10, rpe: 7 }, { t: 'work', kg: 20, r: 6, rpe: 9 }, { t: 'work', kg: 20, r: 6, rpe: 10 }, { t: 'work', kg: 20, r: 4, rpe: 10 }] },
    { eid: 26, sets: [{ t: 'work', kg: 10, r: 8, rpe: 8 }, { t: 'work', kg: 10, r: 10, rpe: 10 }] }
  ]},
  { id: 2, rid: 6, start: "2026-05-05T21:48:18.846Z", end: "2026-05-05T22:53:57.924Z", exercises: [
    { eid: 1, sets: [{ t: 'warmup', kg: 20, r: 5, rpe: 3 }, { t: 'warmup', kg: 40, r: 5, rpe: 7 }, { t: 'warmup', kg: 40, r: 5, rpe: 8 }, { t: 'work', kg: 50, r: 4, rpe: 9 }] },
    { eid: 2, sets: [{ t: 'work', kg: 30, r: 10, rpe: 8 }, { t: 'work', kg: 30, r: 10, rpe: 8 }] },
    { eid: 3, sets: [{ t: 'warmup', kg: 10, r: 12, rpe: 6 }, { t: 'warmup', kg: 10, r: 10, rpe: 7 }, { t: 'work', kg: 12, r: 10, rpe: 8 }, { t: 'work', kg: 12, r: 10, rpe: 9 }] },
    { eid: 4, sets: [{ t: 'warmup', kg: 3, r: 10, rpe: 6 }, { t: 'work', kg: 20, r: 12, rpe: 7 }, { t: 'work', kg: 20, r: 12, rpe: 8 }] },
    { eid: 43, sets: [{ t: 'work', kg: 1, r: 0, rpe: 7 }, { t: 'work', kg: 1, r: 0, rpe: 7 }] },
    { eid: 44, sets: [{ t: 'warmup', kg: 5, r: 15, rpe: 6 }, { t: 'work', kg: 10, r: 8, rpe: 8 }] }
  ]},
  { id: 3, rid: 9, start: "2026-05-07T21:34:07.897Z", end: "2026-05-07T22:46:44.594Z", exercises: [
    { eid: 29, sets: [{ t: 'warmup', kg: 30, r: 8, rpe: 6 }, { t: 'warmup', kg: 40, r: 8, rpe: 8 }, { t: 'work', kg: 40, r: 5, rpe: 8 }, { t: 'work', kg: 40, r: 12, rpe: 9 }] },
    { eid: 30, sets: [{ t: 'warmup', kg: 20, r: 10, rpe: 7 }, { t: 'warmup', kg: 40, r: 10, rpe: 9 }, { t: 'work', kg: 40, r: 10, rpe: 9 }, { t: 'work', kg: 40, r: 10, rpe: 9 }] },
    { eid: 31, sets: [{ t: 'warmup', kg: 15, r: 8, rpe: 5 }, { t: 'work', kg: 25, r: 8, rpe: 8 }, { t: 'work', kg: 25, r: 8, rpe: 9 }, { t: 'work', kg: 25, r: 8, rpe: 9 }] },
    { eid: 32, sets: [{ t: 'warmup', kg: 30, r: 10, rpe: 6 }, { t: 'work', kg: 40, r: 10, rpe: 8 }, { t: 'work', kg: 40, r: 10, rpe: 9 }, { t: 'work', kg: 40, r: 10, rpe: 9 }] },
    { eid: 33, sets: [{ t: 'warmup', kg: 5, r: 15, rpe: 8 }, { t: 'work', kg: 10, r: 5, rpe: 9 }] }
  ]},
  { id: 4, rid: 10, start: "2026-05-08T21:16:13.785Z", end: "2026-05-08T22:44:27.915Z", exercises: [
    { eid: 62, sets: [{ t: 'warmup', kg: 25, r: 12, rpe: 6 }, { t: 'work', kg: 35, r: 12, rpe: 8 }, { t: 'work', kg: 35, r: 12, rpe: 9 }] },
    { eid: 63, sets: [{ t: 'warmup', kg: 68, r: 12, rpe: 7 }, { t: 'work', kg: 68, r: 11, rpe: 10 }] },
    { eid: 64, sets: [{ t: 'warmup', kg: 10, r: 12, rpe: 7 }, { t: 'work', kg: 14, r: 12, rpe: 8 }, { t: 'work', kg: 14, r: 12, rpe: 9 }, { t: 'work', kg: 14, r: 12, rpe: 9 }] },
    { eid: 65, sets: [{ t: 'warmup', kg: 10, r: 15, rpe: 5 }, { t: 'work', kg: 20, r: 12, rpe: 7 }, { t: 'work', kg: 30, r: 12, rpe: 8 }] },
    { eid: 66, sets: [{ t: 'warmup', kg: 26, r: 10, rpe: 7 }, { t: 'work', kg: 40, r: 6, rpe: 10 }, { t: 'work', kg: 33, r: 9, rpe: 10 }] },
    { eid: 67, sets: [{ t: 'warmup', kg: 15, r: 12, rpe: 7 }, { t: 'work', kg: 20, r: 10, rpe: 9 }] }
  ]},
  { id: 5, rid: 7, start: "2026-05-12T21:12:23.587Z", end: "2026-05-12T22:06:04.208Z", exercises: [
    { eid: 9, sets: [{ t: 'work', kg: 33, r: 12, rpe: 5 }, { t: 'work', kg: 40, r: 10, rpe: 7 }, { t: 'work', kg: 47, r: 10, rpe: 8 }] },
    { eid: 12, sets: [{ t: 'work', kg: 54, r: 15, rpe: 9 }] },
    { eid: 13, sets: [{ t: 'warmup', kg: 20, r: 12, rpe: 4 }, { t: 'work', kg: 40, r: 10, rpe: 7 }, { t: 'work', kg: 40, r: 12, rpe: 8 }, { t: 'work', kg: 40, r: 12, rpe: 9 }] },
    { eid: 16, sets: [{ t: 'warmup', kg: 10, r: 12, rpe: 5 }, { t: 'work', kg: 14, r: 12, rpe: 7 }, { t: 'work', kg: 14, r: 12, rpe: 8 }] },
    { eid: 19, sets: [{ t: 'work', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }] },
    { eid: 20, sets: [{ t: 'work', kg: 30, r: 15, rpe: 8 }, { t: 'work', kg: 30, r: 15, rpe: 9 }, { t: 'work', kg: 30, r: 15, rpe: 9 }] },
    { eid: 23, sets: [{ t: 'warmup', kg: 20, r: 10, rpe: 7 }, { t: 'work', kg: 28, r: 8, rpe: 9 }, { t: 'work', kg: 28, r: 6, rpe: 9 }] },
    { eid: 26, sets: [{ t: 'work', kg: 10, r: 10, rpe: 9 }, { t: 'work', kg: 10, r: 10, rpe: 10 }] }
  ]},
  { id: 6, rid: 8, start: "2026-05-13T21:26:40.720Z", end: "2026-05-13T22:06:20.888Z", exercises: [
    { eid: 53, sets: [{ t: 'warmup', kg: 20, r: 4, rpe: 3 }, { t: 'warmup', kg: 40, r: 4, rpe: 5 }, { t: 'work', kg: 60, r: 4, rpe: 7 }] },
    { eid: 56, sets: [{ t: 'work', kg: 40, r: 5, rpe: 7 }] },
    { eid: 57, sets: [{ t: 'warmup', kg: 40, r: 10, rpe: 7 }, { t: 'work', kg: 40, r: 10, rpe: 7 }, { t: 'work', kg: 40, r: 10, rpe: 8 }] },
    { eid: 58, sets: [{ t: 'warmup', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }] },
    { eid: 59, sets: [{ t: 'warmup', kg: 40, r: 12, rpe: 6 }, { t: 'work', kg: 54, r: 12, rpe: 8 }, { t: 'work', kg: 54, r: 12, rpe: 9 }] },
    { eid: 60, sets: [{ t: 'warmup', kg: 20, r: 12, rpe: 5 }, { t: 'work', kg: 30, r: 12, rpe: 7 }, { t: 'work', kg: 30, r: 12, rpe: 8 }] }
  ]},
  { id: 7, rid: 6, start: "2026-05-18T21:52:01.779Z", end: "2026-05-18T22:51:54.311Z", exercises: [
    { eid: 1, sets: [{ t: 'warmup', kg: 26, r: 5, rpe: 5 }, { t: 'warmup', kg: 47, r: 5, rpe: 7 }, { t: 'work', kg: 68, r: 5, rpe: 9 }] },
    { eid: 2, sets: [{ t: 'work', kg: 54, r: 10, rpe: 9 }, { t: 'work', kg: 54, r: 10, rpe: 9 }] },
    { eid: 3, sets: [{ t: 'warmup', kg: 20, r: 10, rpe: 7 }, { t: 'work', kg: 24, r: 10, rpe: 9 }, { t: 'work', kg: 24, r: 10, rpe: 9 }, { t: 'work', kg: 24, r: 10, rpe: 9 }] },
    { eid: 4, sets: [{ t: 'warmup', kg: 10, r: 10, rpe: 7 }, { t: 'work', kg: 15, r: 15, rpe: 9 }, { t: 'work', kg: 15, r: 15, rpe: 9 }] },
    { eid: 43, sets: [{ t: 'work', kg: 0, r: 0 }, { t: 'work', kg: 0, r: 0 }] },
    { eid: 44, sets: [{ t: 'warmup', kg: 5, r: 12, rpe: 7 }, { t: 'work', kg: 10, r: 12, rpe: 9 }, { t: 'work', kg: 5, r: 15, rpe: 9 }] },
    { eid: 47, sets: [{ t: 'warmup', kg: 25, r: 16, rpe: 7 }, { t: 'work', kg: 35, r: 16, rpe: 8 }, { t: 'work', kg: 40, r: 14, rpe: 9 }] },
    { eid: 50, sets: [{ t: 'work', kg: 10, r: 10, rpe: 10 }] }
  ]}
];

export async function seedExercises() {
  // Check if already seeded with this version
  const isSeeded = await db.settings.get('backup_20260519_seeded');
  if (isSeeded) return;

  console.log('[Seed] Iniciando povoamento do banco de dados com backup...');

  // Clear existing data to ensure replacement
  await Promise.all([
    db.exercises.clear(),
    db.routines.clear(),
    db.routineExercises.clear(),
    db.workoutSessions.clear(),
    db.sessionSets.clear(),
    db.bodyMetrics.clear(),
    db.settings.clear()
  ]);

  // 1. Exercises
  const exercisesToInsert: Exercise[] = BACKUP_EXERCISES.map(ex => ({
    id: ex.id,
    name: ex.nome,
    muscleGroup: ex.categoria,
    equipment: 'Outros',
    sub1Id: ex.sub1 || undefined,
    sub2Id: ex.sub2 || undefined,
    youtubeUrl: ex.video_url || undefined,
    notes: ex.ajuda || undefined,
    isCustom: true,
    createdAt: new Date()
  }));
  await db.exercises.bulkAdd(exercisesToInsert);

  // 2. Routines
  const routinesToInsert: Routine[] = BACKUP_ROUTINES.map(r => ({
    id: r.id,
    name: r.nome,
    days: r.days,
    isActive: true,
    createdAt: new Date()
  }));
  await db.routines.bulkAdd(routinesToInsert);

  // 3. Routine Exercises
  const routineExercisesToInsert: RoutineExercise[] = [];
  BACKUP_ROUTINES.forEach(r => {
    r.exercicios.forEach((re, idx) => {
      let technique: any = 'Normal';
      let supersetWith: number | undefined = undefined;

      const currentEx = BACKUP_EXERCISES.find(e => e.id === re.id);
      if (currentEx?.nome.startsWith('A1.')) {
        const nextRe = r.exercicios[idx + 1];
        if (nextRe) {
          const nextEx = BACKUP_EXERCISES.find(e => e.id === nextRe.id);
          if (nextEx?.nome.startsWith('A2.')) {
            technique = 'Superset';
            supersetWith = nextRe.id;
          }
        }
      } else if (currentEx?.nome.startsWith('A2.')) {
        technique = 'Superset';
      }

      routineExercisesToInsert.push({
        routineId: r.id,
        exerciseId: re.id,
        order: idx,
        warmupSets: re.w,
        workSets: re.s,
        repsTarget: re.r,
        restSeconds: re.d || 90,
        technique,
        supersetWith
      });
    });
  });
  await db.routineExercises.bulkAdd(routineExercisesToInsert);

  // 4. Workout Sessions
  const sessionsToInsert: WorkoutSession[] = BACKUP_SESSIONS.map(s => ({
    id: s.id,
    routineId: s.rid,
    startedAt: new Date(s.start),
    finishedAt: new Date(s.end),
    durationSeconds: Math.floor((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000)
  }));
  await db.workoutSessions.bulkAdd(sessionsToInsert);

  // 5. Session Sets
  const setsToInsert: SessionSet[] = [];
  BACKUP_SESSIONS.forEach(s => {
    s.exercises.forEach(exRealized => {
      exRealized.sets.forEach((set, setIdx) => {
        setsToInsert.push({
          sessionId: s.id,
          exerciseId: exRealized.eid,
          setType: set.t as any,
          setNumber: setIdx + 1,
          weightKg: set.kg,
          reps: set.r,
          rpe: set.rpe,
          toFailure: set.r === 0 && set.kg === 0,
          completedAt: new Date(s.end)
        });
      });
    });
  });
  await db.sessionSets.bulkAdd(setsToInsert);

  // 6. Settings (Workout Schedule)
  const schedule: Record<number, number> = {
    1: 6,
    2: 7,
    3: 8,
    4: 9,
    5: 10,
    6: 11
  };
  await db.settings.put({ key: 'workoutSchedule', value: schedule });

  // 7. Body Metrics
  const initialMetrics: BodyMetrics = {
    date: new Date("2026-04-29T21:21:29.558Z"),
    weightKg: 93.3,
    heightCm: 0,
    notes: 'Importado do backup'
  };
  await db.bodyMetrics.add(initialMetrics);

  // 8. Set seeded flag
  await db.settings.put({ key: 'backup_20260519_seeded', value: true });

  console.log(`[Seed] Concluído! Populados: ${exercisesToInsert.length} exercícios, ${routinesToInsert.length} rotinas, ${sessionsToInsert.length} sessões.`);
}
