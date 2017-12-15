# Atlas Eleitoral

Ferramenta de visualização de dados integrada à API do CEPESPData.
Demonstração disponível em http://atlas.jelasticlw.com.br

## Instalação:

Para rodar o build, após clonar o repositório, digite:

`
cd build
node server
`

O aplicativo estará disponível em http://localhost:8008.
Para mudar a porta do servidor http, use o comando –p. Por exemplo, para rodar o servidor na porta 8000, digite:

`
node server –p 8000
`



Os fontes estão na pasta `/src` e usam o Webpack. Para compilar os fontes, é necessário instalar as dependências. Para isso, digite:

`
npm install
`

A seguir, rode o Webpack com o comando: 

` 
npm run dev
`

O Webpack abrirá uma versão de desenvolvimento com *hot reloading*. Para compilar novo build, digite

`
npm run build
`

## Usando o Atlas Eleitoral

O Atlas Eleitoral facilita a visualização dos dados eleitorais do CEPESPData. 

Neste momento, o foco de análise do Atlas Eleitoral são as eleições nos estados e no Distrito Federal. Por isso, permite a análise de dados de eleições para presidente, governador, senador e deputados, mas ainda não incorpora as eleições para prefeito e vereador.

Ao abrir o Atlas Eleitoral, escolha um estado para concentrar sua análise. Escolhido um estado, você poderá fazer dois tipos de análise: comparar o desempenho de vários candidatos ou analisar detalhadamente o padrão de votação de um único candidato.

No primeiro caso, basta adicionar os candidatos que quiser comparar no *painel de candidatos*, à esquerda. Você pode escolher os candidatos digitando parte do nome (como uma busca do Google) ou clicando no botão `BUSCA AVANÇADA`, que abre uma caixa que oferece mais opções de escolha. Escolhidos os candidatos, você poderá, no canto superior direito do mapa, escolher vários gráficos que oferecem diversas formas de você visualizar o desempenho dos candidatos em cada município e zona eleitoral.

Note que não há restrições quanto a quem você pode incluir nas comparações, exceto que todos têm de ter disputado eleição no mesmo estado (senão a comparação só faria sentido para candidatos a presidente da República). Você pode, por exemplo, comparar os candidatos a governador em uma eleição, ou todos os candidatos a senador por um partido desde 1998, ou o desempenho de um deputado nos pleitos de 1998 a 2014. Você pode até fazer comparações aparentemente esdrúxulas, que só fazem sentido para você -- o Atlas Eleitoral é uma ferramenta para *você* encontrar padrões onde ninguém mais procurou! 

O segundo tipo de análise é individual. Adicione um candidato e clique no seu nome; você verá um botão `VER ÍNDICES INDIVIDUAIS`. Clicando nele, você verá dois índices que mostram imediatamente onde o candidato tem mais eleitores: o índice LQ e o índice de importância. 

O *índice LQ* mostra, em azul, os distritos onde o candidato teve votação melhor que sua média global e, em laranja, os distritos onde ele teve votação inferior à sua média. Quanto mais forte a cor, mais longe da média está a votação do candidato no município ou zona em questão. Os municípios em azul são aqueles em que o candidato provavelmente destinou mais recursos.

O *índice de importância*, como o nome diz, mostra exatamente quais são os distritos que mais contribuíram para a votação do candidato; a principal base eleitoral dele aparece em vermelho escuro, e a cor vai ficando mais clara à medida que o distrito for menos importante (ou mais dispensável) para compor a votação final do candidato. É razóavel supor que, quanto mais escuro o vermelho de um município, maior a preocupação do representante eleito em agradar os eleitores daquele município.

Sugiro que você analise individualmente alguns deputados mais votados de seu estado. A estratégia geográfica de cada deputado ficará evidente.

Para fechar a análise individual e retornar ao modo de comparação entre candidatos, basta clicar no botão `VOLTAR A GRÁFICOS COMPARATIVOS` ou clicar novamente no nome do candidato sob análise.

Em ambos os modos de operação, para facilitar a visualização, é possível ver os gráficos de cada zona/município em tamanho uniforme ou proporcional à quantidade de votos daquela zona/município. Basta clicar nos ícones na parte central do lado direito. 

Espero que o Atlas Eleitoral auxilie você a entender melhor quem são nossos políticos e como eles se elegem.

Boa pesquisa!

Fábio Cereda

Dezembro de 2017

