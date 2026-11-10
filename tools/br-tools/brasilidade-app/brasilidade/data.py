"""
Data store for Brasilidade encyclopedia entries and multiple-choice quiz questions.
"""

ENCYCLOPEDIA_DATA = [
    {
        "id": "saudade",
        "title": "Saudade",
        "category": "Língua e Cultura",
        "description": (
            "Sentimento profundo de nostalgia ou melancolia por algo ou alguém que está ausente, "
            "acompanhado pelo desejo de reencontrar ou reviver essa experiência."
        ),
        "tags": ["expressão", "sentimento", "cultura", "português"]
    },
    {
        "id": "festa-junina",
        "title": "Festa Junina",
        "category": "Festas Populares",
        "description": (
            "Celebração tradicional brasileira realizada no mês de junho, em homenagem aos santos católicos "
            "(Santo Antônio, São João e São Pedro), com danças quadrilhas, fogueira, bandeirinhas e comidas típicas de milho."
        ),
        "tags": ["tradição", "nordeste", "mês de junho", "quadrilha"]
    },
    {
        "id": "bossa-nova",
        "title": "Bossa Nova",
        "category": "Música",
        "description": (
            "Movimento da música popular brasileira surgido no final dos anos 1950 no Rio de Janeiro, "
            "caracterizado por ritmos de samba suavizados e harmonias sofisticadas do jazz. "
            "Expoentes incluem Tom Jobim, João Gilberto e Vinicius de Moraes."
        ),
        "tags": ["música", "tom jobim", "joão gilberto", "rio de janeiro"]
    },
    {
        "id": "capoeira",
        "title": "Capoeira",
        "category": "Arte e Esporte",
        "description": (
            "Expressão cultural brasileira que combina artes marciais, música, dança e acrobacias. "
            "Desenvolvida por descendentes de escravizados africanos no Brasil como forma de resistência."
        ),
        "tags": ["arte marcial", "dança", "herança africana", "berimbau"]
    },
    {
        "id": "brasilia",
        "title": "Brasília",
        "category": "História e Geografia",
        "description": (
            "Capital federal do Brasil, planejada e construída no governo de Juscelino Kubitschek e inaugurada em 1960. "
            "O projeto urbanístico foi assinado por Lúcio Costa e a arquitetura icônica por Oscar Niemeyer."
        ),
        "tags": ["capital", "arquitetura", "oscar niemeyer", "juscelino kubitschek"]
    },
    {
        "id": "feijoada",
        "title": "Feijoada",
        "category": "Gastronomia",
        "description": (
            "Um dos pratos mais emblemáticos da culinária brasileira, preparado com feijão-preto e carnes salgadas de porco e boi, "
            "servido com arroz branco, couve refogada, farofa e fatias de laranja."
        ),
        "tags": ["comida típica", "feijão preto", "culinária"]
    },
    {
        "id": "samba",
        "title": "Samba",
        "category": "Música",
        "description": (
            "Gênero musical e dança com raízes afro-brasileiras, considerado símbolo da identidade nacional brasileira "
            "e pilar do Carnaval do Rio de Janeiro e da Bahia."
        ),
        "tags": ["carnaval", "ritmo", "música", "dança"]
    },
    {
        "id": "frevo",
        "title": "Frevo",
        "category": "Festas Populares",
        "description": (
            "Ritmo musical e dança frenética originária de Pernambuco, associada ao Carnaval de Recife e Olinda, "
            "declarada Patrimônio Imaterial da Humanidade pela UNESCO."
        ),
        "tags": ["pernambuco", "olinda", "recife", "carnaval", "sombrinha"]
    }
]


QUIZ_QUESTIONS = [
    {
        "id": 1,
        "category": "Língua e Cultura",
        "question": "O que melhor define a palavra 'Saudade' no contexto cultural brasileiro?",
        "options": [
            "Um sentimento profundo de nostalgia ou melancolia por algo ou alguém ausente.",
            "Uma celebração festiva que acontece no início do ano.",
            "Um prato típico feito à base de milho e coco.",
            "Um estilo musical originário do sertão nordestino."
        ],
        "correct_index": 0,
        "explanation": "'Saudade' descreve uma mistura de afeto, presença interior e melancolia pela ausência de alguém ou algo amado."
    },
    {
        "id": 2,
        "category": "Festas Populares",
        "question": "Qual destas tradições é típica das comemorações da Festa Junina?",
        "options": [
            "Apresentação de desfiles de escolas de samba na Sapucaí.",
            "Dança da quadrilha, fogueira e pratos à base de milho.",
            "Entrega de ovos de chocolate e encenação de rua.",
            "Cortejo do Galo da Madrugada logo ao amanhecer."
        ],
        "correct_index": 1,
        "explanation": "A Festa Junina celebra São João, Santo Antônio e São Pedro com dança de quadrilha, fogueira e comidas como pamonha e canjica."
    },
    {
        "id": 3,
        "category": "Música",
        "question": "Quem foram alguns dos principais fundadores do movimento Bossa Nova nos anos 1950?",
        "options": [
            "Luiz Gonzaga e Humberto Teixeira",
            "Tom Jobim, João Gilberto e Vinicius de Moraes",
            "Chiclete com Banana e Ivete Sangalo",
            "Cartola e Nelson Cavaquinho"
        ],
        "correct_index": 1,
        "explanation": "Tom Jobim, João Gilberto e Vinicius de Moraes são figuras fundamentais do movimento Bossa Nova."
    },
    {
        "id": 4,
        "category": "Arte e Esporte",
        "question": "Qual instrumento musical tradicional é o principal regente de uma roda de Capoeira?",
        "options": [
            "Pandeiro",
            "Berimbau",
            "Atabaque",
            "Agogô"
        ],
        "correct_index": 1,
        "explanation": "O berimbau comanda o ritmo e o estilo do jogo na roda de capoeira."
    },
    {
        "id": 5,
        "category": "História e Geografia",
        "question": "Quem assinou o projeto urbanístico da cidade de Brasília, inaugurada em 1960?",
        "options": [
            "Oscar Niemeyer",
            "Lúcio Costa",
            "Roberto Burle Marx",
            "Juscelino Kubitschek"
        ],
        "correct_index": 1,
        "explanation": "Lúcio Costa desenvolveu o Plano Piloto urbanístico de Brasília, enquanto Oscar Niemeyer projetou seus edifícios monumentais."
    },
    {
        "id": 6,
        "category": "Gastronomia",
        "question": "Qual o acompanhamento tradicionalmente servido com a Feijoada brasileira para neutralizar a gordura?",
        "options": [
            "Fatias de laranja",
            "Doce de leite",
            "Batata frita",
            "Queijo coalho"
        ],
        "correct_index": 0,
        "explanation": "Fatias de laranja são servidas com a feijoada porque o ácido da fruta ajuda na digestão das carnes pesadas."
    },
    {
        "id": 7,
        "category": "Festas Populares",
        "question": "De qual estado brasileiro o ritmo e a dança do Frevo são originários?",
        "options": [
            "Bahia",
            "Rio de Janeiro",
            "Pernambuco",
            "Minas Gerais"
        ],
        "correct_index": 2,
        "explanation": "O Frevo é uma manifestação cultural típica de Pernambuco, com destaque para Recife e Olinda."
    },
    {
        "id": 8,
        "category": "História e Geografia",
        "question": "Em que ano o Brasil declarou sua independência de Portugal?",
        "options": [
            "1500",
            "1822",
            "1889",
            "1930"
        ],
        "correct_index": 1,
        "explanation": "A Independência do Brasil foi proclamada em 7 de setembro de 1822 por Dom Pedro I."
    }
]
