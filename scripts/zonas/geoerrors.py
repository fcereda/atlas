# coding=utf-8

import csv
from urllib.request import urlopen 
import json


# Not sure this is necessary any longer

import unicodedata
import re


def unicode_csv_reader(unicode_csv_data, dialect=csv.excel, **kwargs):
	# csv.py doesn't do Unicode; encode temporarily as UTF-8:
	csv_reader = csv.reader(utf_8_encoder(unicode_csv_data),
							dialect=dialect, **kwargs)
	for row in csv_reader:
		# decode UTF-8 back to Unicode, cell by cell:
		yield [unicode(cell, 'utf-8') for cell in row]

def utf_8_encoder(unicode_csv_data):
	for line in unicode_csv_data:
		yield line.encode('utf-8')


def getAddresses (fileName, addresses = {}):

	import unicodedata

	def remove_diacritic(input):
		'''
		Accept a unicode string, and return a normal string (bytes in Python 3)
		without any diacritical marks.
		'''
		# This is a big hack and I am not proud of it
		output = input.replace('√', 'A').replace('¬', 'A').replace('¡','A').replace('”', 'O').replace('‘', 'O').replace('’', 'O').replace('«', 'C').replace('Õ', 'I').replace('…', 'E').replace(' ','E').replace('⁄', 'U')
		return output
	
	print ('Loading addresses from file ' + fileName)

	with open(fileName, 'rt', encoding='mac_roman') as csvfile:
		fileReader = csv.reader(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		i = 0
		for row in fileReader:
			if (i > 0):
				uf = row[6]
				zona = row[0]
				key = uf + zona
				address = row[2] + ', ' + row[5] + ', ' + uf + ', ## ' + row[3]
				address = remove_diacritic(address)
				addresses[key] = address
			i+=1
		return addresses	

def loadErrors (addresses):
	fileName = './zonas.csv'
	with open(fileName, 'rt', encoding='utf-8') as csvfile:
		fileReader = csv.reader(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
		i = 0
		errors = []
		for row in fileReader:
			if (i > 0):
				uf = row[0]
				zona = row[1]
				key = '{}{}'.format(uf, zona)
				#print (key)
				status = row[4]
				if (status != 'ok'):
					print ('Error found in ' + key)
					errors.append({
						'uf': uf,
						'zona': zona,
						'address': addresses[key]
					})
			i+=1			
		return errors			 


def saveAsCSV (fileName, items, headers):
	with open(fileName, 'w', encoding='utf-8') as csvfile:
		fileWriter = csv.writer(csvfile, delimiter=';', quotechar='¨', quoting=csv.QUOTE_MINIMAL)
		fileWriter.writerow(headers)
		for item in items:
			fileWriter.writerow([item['uf'], item['zona'], item['address']])


baseNomeArquivo = 'relação_de_zonas_eleitorais_'
estados = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']
if (len(estados) != 27):
	print ("Tamanho do array estados é diferente de 27 (%i)" % len(estados))

addresses = {}
for estado in estados:
	getAddresses('./csv/%s%s.csv' % (baseNomeArquivo, estado), addresses)

print (addresses)

errors = loadErrors(addresses)

saveAsCSV ('errors.csv', errors, ['UF', 'zona', 'address', 'postal-code'])





