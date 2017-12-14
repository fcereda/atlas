# Atlas Eleitoral

Ferramenta de visualização de dados integrada à API do CEPESPData.
Demonstração disponível em http://atlas.jelasticlw.com.br

## Instalação:

Para rodar o build, após clonar o repositório, digite:

`
cd build
node server
`

O aplicativo estará disponível em http://localhost:8080.
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

##Usando o Atlas Eleitoral

O Atlas Eleitoral facilita a visualização dos dados eleitorais do CEPESPData. 

Neste momento, o foco de análise do Atlas Eleitoral são as eleições nos estados e no Distrito Federal. Por isso, permite a análise de dados de eleições para presidente, governador, senador e deputados, mas não incorpora as eleições para prefeito e vereador.

Ao abrir o Atlas Eleitoral, você deverá escolher um estado para concentrar sua análise. Escolhido um estado, você selecionará, no *painel de candidatos* (à esquerda), os candidatos cujo desempenho eleitoral deseja analisar e comparar. Não há restrições quanto a que candidatos podem ser vistos na mesma tela – é possível, por exemplo, comparar o desempenho de candidatos a presidente com o de candidatos a deputado federal ou estadual, inclusive de eleições diferentes.

Os dados dos candidatos selecionados são plotados no mapa por município. No caso dos municípios com mais de uma zona eleitoral, os dados são plotados no centro geográfico estimado de cada zona. Assim, é possível ver com exatidão a distribuição geográfica do desempenho eleitoral dos candidatos no estado sob análise. 

O mapa possui dois modos de operação. No modo padrão, ele compara o desempenho eleitoral dos candidatos que figurarem no painel de candidatos. No canto superior direito do mapa, você encontrará diversos tipos de gráficos, que oferecem diversas formas de se compararem as votações dos candidatos em cada zona/município. 

O segundo modo de operação, acessível quando se clica no nome de um candidato, é o de visualização de índices individuais. Esse modo permite que se veja a concentração dos votos de um candidato, e as regiões em que ele é mais forte e mais fraco. Neste momento, o Atlas Eleitoral calcula dois índices: 

- o **índice LQ** (quociente de locação), que compara o desempenho de um candidato em um distrito com o desempenho global do candidato. Um LQ de 1 indica que a votação do candidato naquele distrito foi proporcional à votação do candidato em todo o estado; um LQ maior que 1 indica que o candidato teve desempenho melhor naquele distrito do que no estado, e LQ menor que 1 indica que o candidato teve proporcionalmente menos votos no distrito do que teve no estado 
como um todo.

- o **índice de importância** (IP), que indica quais foram os distritos mais importantes para a votação de um candidato. Quanto menor o índice, maior peso teve aquele distrito para a votação do candidato. O Atlas Eleitoral calcula o índice ordenando os distritos em ordem decrescente de votos dados ao candidato em questão; o índice é a proporção entre a soma dos votos do distrito, e de todos os distritos que deram mais votos ao candidato, e a votação total do candidato. Por exemplo, um distrito com índice de 0,2 indica que o distrito está no quintil superior dos votos dados ao candidato.

Para retornar ao modo de comparação, basta clicar no botão `VOLTAR A COMPARAÇÕES` ou fechar o quadro do candidato em questão.

Em ambos os modos de operação, para facilitar a visualização, é possível ver os gráficos de cada zona/município em tamanho uniforme ou proporcional à quantidade de votos daquela zona/município. 

Para selecionar mais de um candidato por vez, procurar pelos mais votados ou ver os candidatos de um partido para uma determinada eleição, clique em `BUSCA AVANÇADA`.


