import sys
from urllib.request import urlopen, urlretrieve 
import json
import gzip
import csv

def loadCSV (url):
    #response = urlopen(url)
    (csvFileName, headers) = urlretrieve(url)
    csvFile = open(csvFileName, 'rt')
    rows = csv.DictReader(csvFile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

    candidatos = []
    for row in rows:
        candidato = {}
        for key in row:
            candidato[key] = row[key]
        candidatos.append(candidato)    

    return candidatos     


def getUrl (ano, cargo):
    url = 'http://cepesp.io/api/consulta/legendas?ano={}&cargo={}'.format(ano, cargo)
    return url

def saveAsCSV (list, fileName, headers=[]):
    if (len(headers) == 0):
        headers = []
        for key in list[0]:
            headers.append(key)
        print('Salvando os seguintes campos:')
        print(headers)

    with open(fileName, 'w', encoding='utf-8') as csvfile:
        fileWriter = csv.writer(csvfile, delimiter=',', quotechar='¨', quoting=csv.QUOTE_MINIMAL)
        fileWriter.writerow(headers)
        for item in list:
            #print('salvando:')
            #print(item)

            try:
                row = []
                for field in headers:
                    if (field in item):
                        row.append(item[field])
                    else:
                        row.append('')  
                fileWriter.writerow(row)
            except:
                print('Erro tentando gravar a seguinte linha:')
                print(item)
                exit()  


def saveAsJson (list, fileName):
    with open(fileName, 'w', encoding='utf-8') as jsonFile:
        json.dump(list, jsonFile)


def runATest ():
    print(getUrl(2016, 6))
    rows = loadCSV(getUrl(2014, 6))
    #for candidato in candidatos:
    #    print(candidato)

    partidos = {}
    for row in rows:
        partido = row['SIGLA_PARTIDO']
        if (not partido in partidos):
            partidos[partido] = {
                'sigla': partido,
                'numero': row['NUMERO_PARTIDO']
            }    


    for partido in partidos:
        print('{} {}'.format(partidos[partido], partido))


#runATest()
#exit()

fileName = 'partidos.json'
partidos = {}
for ano in [1998, 2002, 2006, 2010, 2014]:
    rows = loadCSV(getUrl(ano, 6))
    for cargo in [1, 3, 5, 6, 7, 8, 11]:
        sys.stdout.write('Obtendo lista de partidos para o ano {}...    \r'.format(ano))
        sys.stdout.flush()
        for row in rows:
            partido = row['SIGLA_PARTIDO']
            if (not partido in partidos):
                partidos[partido] = {
                    'sigla': partido,
                    'numero': row['NUMERO_PARTIDO'],
                    'anos': []
                }    
            if (not ano in partidos[partido]['anos']):
                partidos[partido]['anos'].append(ano)

            
print('\nGravando lista de partidos no arquivo ' + fileName)
partidosArr = []
for partido in partidos:
    partidosArr.append(partidos[partido])
saveAsJson(partidosArr, fileName)
print('{} linhas foram gravadas no arquivo {}'.format(len(partidosArr), fileName))
exit()
