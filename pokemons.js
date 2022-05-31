
$('#form-trainer').on('submit',e=>{
    e.preventDefault();
    setTrainer(e.target[0].value);
});

$('#form-pokemon').on('submit',e=>{
    e.preventDefault();
    getPokemons(e.target[0].value);
});    

const handleStorage = {
    setItem(key, data){
        localStorage.setItem(key, data);
    },

    getItem(key){
        return localStorage.getItem(key);
    }    
}

getTrainers();

$('#select-trainer').on('change',e=>{
    const idTrainer = $('#select-trainer option:selected').val();
    const localTrainers = JSON.parse(handleStorage.getItem('trainers'));
    
    const [trainer] = localTrainers.filter(res=> res.id==idTrainer);

    $('.dados-pokemon').remove();
    
    getTrainerPokemons(localTrainers);
});

function getAjax(url){
    return $.ajax({
        url: url,
        method: 'get',
    })
}

function getTrainerPokemons(trainers){
    const idTrainer = $('#select-trainer option:selected').val();
    const [trainer] = trainers.filter(res=> res.id==idTrainer);

    trainer.pokemons.map(pokemon=>{
        getPokemons(pokemon);
    });
}

function setTrainer(trainer){
    const localTrainers = JSON.parse(handleStorage.getItem('trainers'));
    const oldTrainers = !localTrainers ? [] : localTrainers; 

    const lastId = oldTrainers[0] ? oldTrainers[oldTrainers.length - 1].id : 1;

    const newTrainers=  [...oldTrainers,{id: lastId + 1, name: trainer, pokemons: [] }];
    
    handleStorage.setItem('trainers', JSON.stringify(newTrainers));

    const option = $('<option></option>').val(lastId + 1).text(trainer);
    $('#select-trainer').append(option);

    $('#input-trainer').val('');
}

function setTrainerPokemon(pokemon, evolve){
    const oldTrainers = JSON.parse(handleStorage.getItem('trainers'));

    if(!oldTrainers){
            setTrainer('default');
    };
    const localTrainers = JSON.parse(handleStorage.getItem('trainers'));

    const idTrainer = $('#select-trainer option:selected').val();

    var trainerPokemons = [];
    const map = localTrainers.map(trainer=>{

        if(trainer.id==idTrainer && !evolve){
            trainerPokemons = trainer.pokemons;
            trainerPokemons = trainerPokemons.filter(res=> res!=pokemon);
            trainer.pokemons = [...trainerPokemons,pokemon];
        }
        return trainer;
    })
    
    handleStorage.setItem('trainers',JSON.stringify(map));
}

function getTrainers(){
    const trainers = JSON.parse(handleStorage.getItem('trainers'));
    if(trainers){
        trainers.map(trainer=>{
            const option = $('<option></option>').val(trainer.id).text(trainer.name);
            $('#select-trainer').append(option);
        });

        getTrainerPokemons(trainers);
    }
}

function removePokemon(idPokemon,pokemon){
    const localTrainers = JSON.parse(handleStorage.getItem('trainers'));
    const idTrainer = $('#select-trainer option:selected').val();
    const [trainer] = localTrainers.filter(res=> res.id==idTrainer);

    var trainerPokemons = [];

    const map = localTrainers.map(trainer=>{

        if(trainer.id==idTrainer){
            trainerPokemons = trainer.pokemons;
            trainerPokemons = trainerPokemons.filter(res=> res!=pokemon);
            trainer.pokemons = trainerPokemons;
        }
        return trainer;
    });

    handleStorage.setItem('trainers',JSON.stringify(map));

    $(`#dados-pokemon-${idPokemon}`).remove();
}



function getEvolution(idPokemon){
    getAjax(`https://pokeapi.co/api/v2/pokemon-species/${idPokemon}/`).then(data=>{
        getAjax(data.evolution_chain.url).then(res=>{
        
            $(`#desvolve-${idPokemon}`).on('click',e=>{
                if(data.evolves_from_species){
                    removePokemon(idPokemon);
                    getPokemons(data.evolves_from_species.name, true);
                } 
            });

            $(`#evolve-${idPokemon}`).on('click',e=>{
                if(res.chain.evolves_to[0].evolves_to[0].species.name){
                    removePokemon(idPokemon);
                    getPokemons(res.chain.evolves_to[0].evolves_to[0].species.name, true);
                }
            });

        })
    })
}

function getPokemons(pokemon, evolve = false){
    getAjax(`https://pokeapi.co/api/v2/pokemon/${pokemon}`).then(data=>{

        if($(`#dados-pokemon-${data.id}`)[0]){
            return;
        }

        setTrainerPokemon(pokemon, evolve);

        const html= $(`<div></div>`).addClass('dados-pokemon').attr('id', `dados-pokemon-${data.id}`);

        /*---------------------------IMG---------------------------*/
        const divPokemonImg = $('<div></div>').addClass('pokemon-img');
        divPokemonImg.append(`
            <img src=${data.sprites.front_default} alt=pokemon-front>
            <b>${data.name}</b>
        `);
        html.append(divPokemonImg);
        /*---------------------------------------------------------*/

        /*-------------------------EVOLVE--------------------------*/
        const divEvolve= $('<div></div>').addClass('evolve');
        const buttonDesvolve= $('<button>Desevoluir</button>').attr('id',`desvolve-${data.id}`).text('Desevoluir').addClass('button-desvolve');
        const buttonEvolve= $(`<button></button>`).attr('id', `evolve-${data.id}`).text('Evoluir').addClass('button-evolve');
        divEvolve.append(buttonDesvolve,buttonEvolve);
        html.append(divEvolve);
        /*---------------------------------------------------------*/

        /*------------------------ABILITIES------------------------*/
        const divAbilities = $('<div></div>').addClass('abilities');
        divAbilities.append('<b>Habilidades:</b>');
        data.abilities.map(abilidade=>{
            divAbilities.append(`
            <li>
                <b>${abilidade.ability.name}</b>
            </li>
            `);
        });
        html.append(divAbilities);
        /*--------------------------------------------------------*/

        /*---------------------------MOVES------------------------*/
        const divMoves = $('<div></div>').addClass('moves');
        divMoves.append('<b>Movimentos</b>');
        data.moves.map(movement=>{
            const li = $(`<li></li>`);
            const b  = $(`<b>${movement.move.name}</b>`);
            b.on('click', e=>{
                getAjax(movement.move.url).then(res=>{
                    if( $(`#pokemon-moves-${res.id}`)[0] ){
                        $(`#pokemon-moves-${res.id}`).remove();
                        return;
                    } 
                    const ul = $('<ul></ul>').attr('id',`pokemon-moves-${res.id}`);
                    ul.append(`<li>Precisão: <b>${res.accuracy}</b></li>`);
                    ul.append(`<li>Tipo: <b>${res.contest_type.name}</b></li>`);
                    ul.append(`<li>Dano: <b>${res.damage_class.name}</b></li>`);
                    ul.append(`<li>Pontos: <b>${res.pp}</b></li>`);
                    ul.append(`<li>Tipo ataque: <b>${res.type.name}</b></li>`);
                    ul.append(`<li>Efeito: <b>${res.effect_entries[0].short_effect}</b></li>`);

                    li.append(ul);
                });
            });

            li.append(b);

            divMoves.append(li);
        });
        html.append(divMoves);
        /*--------------------------------------------------------*/

        /*---------------------------STATS------------------------*/
        const divStats = $('<div></div>').addClass('stats');
        divStats.append('<b>Stats: </b>');
        data.stats.map(status=>{
            const li = $('<li></li>').text(`${status.stat.name} : `);
            const local = localStorage.getItem(`stat-${status.stat.name}-${data.id}`);
            const input = $('<input>').attr('type', 'number').val(local ? local : status.base_stat).on('change',e=>{
                handleStorage.setItem(`stat-${status.stat.name}-${data.id}`, e.target.value);
            });
            li.append(input);
            divStats.append(li);
        });
        html.append(divStats);
        /*---------------------------------------------------------*/

        /*---------------------------TYPES-------------------------*/
        const divTypes= $('<div></div>').addClass('types');
        divTypes.append('<b>Tipos: </b>');
        const boxTypes = $('<div></div>').addClass('box-types');
        data.types.map(tipo=>{
            boxTypes.append(`<h4>${tipo.type.name}</h4>`);
        });
        divTypes.append(boxTypes);
        html.append(divTypes);
        /*----------------------BUTTON DELETE-----------------------*/

        const divButtonDelete = $('<div></div>').addClass('button-delete');
        const buttonDelete = $('<button></button>').text('Remover').attr('id', 'delete').on('click', e=>{
            removePokemon(data.id, data.name);
        })
        divButtonDelete.append(buttonDelete);
        html.append(divButtonDelete);
        /*----------------------------------------------------------*/

        $('.pokemons').append(html);

        getEvolution(data.id);

    }).fail(error=>{
        alert('Pokemon não encontrado');
    })

}