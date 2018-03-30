<template>

    <div class="pt-2 pb-2" style="display:flex;flex-direction:row;border-top:1px solid #aaa">

        <div class="pt-1 pl-1 pr-4" >
            <span style="font-size:30px;font-weight:300;color:#444">{{ ano }}</span>
        </div>    

        <div style="width:100%;">
            <div style="font-size:18px;font-weight:500">
                {{ identificacaoCargo }}&nbsp;&nbsp;<v-icon v-if="foiEleito" color="green darken-1">check_circle</v-icon>
            </div>
                <div v-for="eleicao in eleicoes" style="font-size:17px;width:100%;">
                <span v-html="descricaoResultado(eleicao)"></span>&nbsp;
                <template v-if="podeAdicionarCandidato">
                <v-tooltip bottom>
                    <v-icon class="pointer" color="primary" slot="activator" @click="verNoMapa(eleicao)">add_box</v-icon>
                    <span>Ver no mapa</span>
                </v-tooltip>    
                </template>
            </div>
        </div>        

    </div>

</template>

<style>

.resultado-eleicao:hover {
    text-decoration: underline;
    cursor: pointer;
}

</style>

<script>

import Utils from '../lib/utils.js'

export default {

	props: ['ano', 'cargo', 'uf', 'eleicoes', 'ufAtual'],

	data () {

		return {
		}

	},

    computed: {

        nomeCargo () {
            if (this.cargo == 'pr1')
                return 'Presidente'
            if (this.cargo == 'g1')
                return 'Governador'
            return Utils.obterNomeCargo(this.cargo)
        },

        nomeUf () {
            var uf = Utils.obterUfPorSigla(this.uf)
            if (uf) {
                return uf.nome
            }
            return ''
        },

        identificacaoCargo () {
            if (this.cargo == 'pr1')
                return 'Presidente da República'
            if (this.cargo == 'g1')
                return 'Governador de ' + this.nomeUf
            return this.nomeCargo + ' por ' + this.nomeUf
        },

        foiEleito () {
            var lastEleicao = this.eleicoes[this.eleicoes.length-1]
            var resultado = lastEleicao.resultado
            var index = resultado.indexOf('ELEITO')
            return index == 0
            return this.desempenho[this.desempenho.length-1].resultado.indexOf('ELEITO') == 0
        },

        descricao () {
            if (this.cargo == 'pr1' || this.cargo == 'g1') {
                return 'Candidato a cargo majoritário, já vamos ver essa entrada'
            }
            else {
                var texto = `${ this.desempenho[0].resultado } com ${ Utils.formatInt(this.desempenho[0].votacao) } votos `
                if (this.desempenho[0].classificacao) {
                    texto += `(${ this.desempenho[0].classificacao }&ordm; lugar)`
                }
                return texto
            }
        },

        podeAdicionarCandidato () {
            return (this.uf == this.ufAtual) || (this.uf == 'BR')
        }

    },

	methods: {

        formatInt (numero) {
        	return Utils.formatInt(numero)
        },

        identificacaoResultado (resultado, cargo) {
            if (resultado.indexOf('ELEITO') == 0)
                return 'Eleito com'
            if (resultado.charAt(0) == '2')
                return 'Passou para o 2o. turno com'
            if (resultado.indexOf('SUPLENTE') == 0)
                return 'Obteve uma suplência com'
            // Se chegar aqui, é porque não foi eleito.
            // Vamos escolher a mensagem certa de acordo com cargo
            if (cargo == 'pr1' || cargo == 'g1')
                return 'Não passou para o 2o. turno, obtendo'
            return 'Não foi eleito, obtendo'
        },

        teveExito (eleicao) {
            return (eleicao.resultado.indexOf('ELEITO') == 0 || eleicao.resultado.charAt(0) == '2')
        },

        descricaoResultado (eleicao) {
            var descricao = `${ this.identificacaoResultado(eleicao.resultado, eleicao.cargo) } ${ Utils.formatInt(eleicao.votacao) } votos`
            if (this.cargo != 'pr1' && eleicao.classificacao) {
                descricao += ` (${ eleicao.classificacao }&ordm; lugar)`
            }
            return descricao
        },

        verNoMapa (eleicao) {
            this.$emit('add-candidate', eleicao)
        }

    }    

}

</script>