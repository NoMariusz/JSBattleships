const shipsLengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];


const boardSize = 10;
const boardCellSizePercent = 100/boardSize;
const boardPXSize = 400;
const boardHeadSize = 35;

var playerBoard = [];
var computerBoard = [];
var selectedShip = null;
var settingPosition = 0; //0 - poziom, 1 - pion
// Znaczenie kontrolek w tablicy: 0 - puste pole, 1 - ustawiony statek, 2 - można ustawić statek, 3 - nie można ustwić statku
// 5 - nietrafiony, 6 - trafiony, 7 - obrysowany trafiony
var actualBlock = null;

var mainGameStarted = false;
var playerTurn = true;
var playerShipPoints = 0;   // ship cells count in player board
shipsLengths.map(el => playerShipPoints += el);
var computerShipPoints = playerShipPoints;
var playerRemainingShips = [...shipsLengths.sort((a, b) => b - a)]

var computerKnowledgeBoard = []; // board only with that, what computer see in player board
// in computerKnowledgeBoard 0 - blank cell, 1 - hit cell, 2- not hit cell
var findedPlayerShipPos = []; // var to store pos of ship cell that was not destroyed yet
var shotingShipLen = 0;

function start(){
    const computerBoardParrent = document.querySelector('.computerBoard');
    const playerBoardParrent = document.querySelector('.playerBoard');

    function prepareGame(full=true){
        console.log('preparing game');
        fillBoard(playerBoard);
        fillBoard(computerBoard);
        fillBoard(computerKnowledgeBoard);
        setShipsInComputerBoardtable();
        renderBoardByArray();
        renderBoardByArray(false);
        initShipsToLoacate();
        if (full){
            initChangeShipPosition();
        }
        document.querySelector('#startBtn').onclick = startBtnClick;
    }

    function fillBoard(board){
        for (var iter=0; iter < boardSize + 2; iter++){
            board.push([]);
            for (var iter2=0; iter2 < boardSize + 2; iter2++){
                board[iter].push(0);
            }
        }
    }

    function setShipsInComputerBoardtable(){
        // ustawianie statków
        var canShipLocated = false;
        var shipPos = 0 // 0 - poziom, 1 - pion
        shipsLengths.forEach(shipLong => {
            canShipLocated = false;
            while(! canShipLocated){
                //randomizuje pozycję(pion, poziom), x, y
                shipPos = Math.round(Math.random());
                if (shipPos == 0){  //poziom
                    var randomX = Math.round(Math.random() * (boardSize - shipLong) + 1);
                    var randomY = Math.round(Math.random() * (boardSize - 1) + 1);
                } else {        // pion
                    var randomX = Math.round(Math.random() * (boardSize - 1) + 1);
                    var randomY = Math.round(Math.random() * (boardSize - shipLong) + 1);
                }

                // sprawdzanie, czy mozna ustawić statek
                canShipLocated = checkShipLocation(shipPos, randomY, randomX, shipLong, computerBoard);
            };
            // ustawia statek w tablicy
            if (shipPos == 0){  // poziom
                for (var locateIter = randomX; locateIter < randomX + shipLong; locateIter++){
                    computerBoard[randomY][locateIter] = 1;
                }
            } else {    // pion
                for (var locateIter = randomY; locateIter < randomY + shipLong; locateIter++){
                    computerBoard[locateIter][randomX] = 1;
                }
            }
        });
        console.log('load computer board', computerBoard)
    }

    function checkShipLocation(shipPos, tableRow, tableColumn, shipLong, board){
        // sprawdza, czy mona ustawić statek w tablicy
        if (shipPos == 0){  //poziom
            for (var checkIter = tableRow-1; checkIter <= tableRow + 1; checkIter++){
                for (var checkIter2 = tableColumn-1; checkIter2 <= tableColumn + shipLong; checkIter2++){
                    if (checkIter2 > boardSize + 1) return false;
                    if (board[checkIter][checkIter2] == 1){
                        return false
                    }
                }
            }
        } else {    // pion
            for (var checkIter = tableRow-1; checkIter <= tableRow + shipLong; checkIter++){
                if (checkIter > boardSize + 1) return false;
                for (var checkIter2 = tableColumn-1; checkIter2 <= tableColumn + 1; checkIter2++){
                    if (board[checkIter][checkIter2] == 1){
                        return false
                    }
                }
            }
        }
        return true;
    }

    function renderBoardByArray(player=true){
        var board = player ? playerBoard : computerBoard;
        console.log('rendering board by arr', board);
        var boardParrent = player ? playerBoardParrent : computerBoardParrent;
        // renderowanie planszy z tablicy
        boardParrent.style.width = boardPXSize + 'px';
        boardParrent.parentElement.style.width = boardPXSize + 'px';
        boardParrent.style.height = boardPXSize + 'px';
        boardParrent.parentElement.style.height = boardPXSize + boardHeadSize + 'px';
        for (var tableRow = 1; tableRow <= boardSize; tableRow++){
            for (var tableColumn = 1; tableColumn  <= boardSize; tableColumn++){
                var block = document.createElement('div');
                block.classList.add('block');
                block.style.width = boardCellSizePercent.toString() + "%";
                block.style.height = boardCellSizePercent.toString() + "%";
                block.style.left = ((tableColumn -1) * boardCellSizePercent).toString() + '%';
                block.style.top = ((tableRow -1) * boardCellSizePercent).toString() + '%';
                block.dataset.tableRow = tableRow;
                block.dataset.tableColumn = tableColumn;

                if (player){
                    block.onmouseover = onBlockMouseOver;
                    block.onmouseout = onBlockMouseOut;
                } else {
                    block.onclick = playerClickOnComputerCell;
                }

                switch (board[tableRow][tableColumn]) { // switch który nadaje odpowiedni kolor w tablicy zależnie od kontrolki
                    case 1:
                        if (player){
                            block.classList.add('selected');
                        }
                        break;
                    case 2:
                        block.classList.add('ok');
                        break;
                    case 3:
                        block.classList.add('badPosition');
                        break;
                    case 4:
                        block.classList.add('badPosition');
                        break;
                }

                boardParrent.appendChild(block);
            }
        }
    }

    function reRenderBoardByArray(player=true, showShips=false){
        var board = player ? playerBoard : computerBoard;
        var boardParrent = player ? playerBoardParrent : computerBoardParrent;
        // odświeża kolory komórek w planszy na podstawie wartości z tablicy
        for (var iter = 0; iter < boardParrent.children.length; iter++){
            var block = boardParrent.children[iter];
            var tr = parseInt(block.dataset.tableRow);
            var tc = parseInt(block.dataset.tableColumn);
            clearOtherColors(block);
            block.innerHTML = '';// for do usuwania nodów strzałów
            switch (board[tr][tc]) { // switch który nadaje odpowiedni kolor w tablicy zależnie od kontrolki
                case 1:
                    if ((player) || (showShips)){
                        block.classList.add('selected');
                    }
                    if (!mainGameStarted){
                        block.addEventListener('click', pullDownShip);
                    }
                    break;
                case 2:
                    block.classList.add('ok');
                    break;
                case 3:
                    block.classList.add('badPosition');
                    break;
                case 4:
                    block.classList.add('badPositionShipBellow');
                    break;
                case 5:
                    var p = document.createElement('p')
                    p.innerHTML = '.'
                    block.appendChild(p);
                    break;
                case 6:
                    if ((showShips) || (player)){
                        block.classList.add('selected');
                    }
                    var p = document.createElement('p')
                    p.innerHTML = 'X'
                    block.appendChild(p);
                    break;
                case 7:
                    if ((showShips) || (player)){
                        block.classList.add('selected');
                    }
                    block.classList.add('outlined');
                    var p = document.createElement('p')
                    p.innerHTML = 'X'
                    block.appendChild(p);
                    break;
            }
        }
    }

    function clearOtherColors(elem){        // czyści klasy inncyh kolorów z elementu
        ['ok', 'badPosition', 'selected', 'badPositionShipBellow', 'outlined'].forEach((colorClass) => {
            elem.classList.remove(colorClass);
        });
    }

    function onBlockMouseOver(e){
        // console.log('blockMouseOver');
        if (selectedShip != null){
            actualBlock = e.target;
            displayLocationToBlock();
        }
    }

    function displayLocationToBlock(){
        // pokazuje kolorując tablicę, możliwość ustawienia statku i daje możliwośc jej zatwierdzenia
        var shipLen = parseInt(selectedShip.dataset.len);
        var tr = parseInt(actualBlock.dataset.tableRow);
        var tc = parseInt(actualBlock.dataset.tableColumn);
        // console.log('displayLocationToBlock()', tr, tc);
        var newCords = moveAtBorder(shipLen, tr, tc, settingPosition)
        tr = newCords[0]
        tc = newCords[1]
        var canLocateShip = checkShipLocation(settingPosition, tr, tc, shipLen, playerBoard);
        var locationControl = canLocateShip ? 2 : 3;
        locateShip(settingPosition, tr, tc, shipLen, locationControl, playerBoard);
        reRenderBoardByArray();
        actualBlock.onclick = () => {
            if (canLocateShip){
                userAcceptLocation(tr, tc, playerBoard)
                actualBlock.onclick = null;
                actualBlock = null;
            }
        }
    }

    function onBlockMouseOut(e){
        // console.log('blockMouseOut');
        if (actualBlock != null){
            clearInconstantControlsFromBoard(playerBoard);
            reRenderBoardByArray();
            actualBlock.onclick = null;
            actualBlock = null;
        }
    }
    
    function moveAtBorder(shipLen, tr, tc, shipPos){
        if (shipPos == 0){ //poziom
            if (tc + shipLen > 11) {
                tc = 12 - shipLen - 1
            }
        } else {    //pion
            if (tr + shipLen > 11) {
                tr = 12 - shipLen - 1
            }
        }
        return [tr, tc]
    }

    function locateShip(shipPos, tableRow, tableColumn, shipLong, locationcontrol, board){
        // ustawia statek w tablicy, zaznaczając w tablicy odpowiednio kontrolki
        if (shipPos == 0){  // poziom
            for (var locateIter = tableColumn; locateIter < tableColumn + shipLong; locateIter++){
                if (locateIter > boardSize) break; 
                if (board[tableRow][locateIter] != 1){
                    board[tableRow][locateIter] = locationcontrol;
                } else {
                    board[tableRow][locateIter] = 4  // when try locate ship on other ship
                }
            }
        } else {    // pion
            for (var locateIter = tableRow; locateIter < tableRow + shipLong; locateIter++){
                if (locateIter > boardSize) break; 
                if (board[locateIter][tableColumn] != 1){
                    board[locateIter][tableColumn] = locationcontrol;
                } else {
                    board[locateIter][tableColumn] = 4
                }
            }
        }
    }

    function userAcceptLocation(tr, tc, board){
        // wtedy gdy użytkownik potwierdza chęć ustawienia statku w tablicy
        var shipLong = parseInt(selectedShip.dataset.len)
        locateShip(settingPosition, tr, tc, shipLong, 1, playerBoard)
        clearInconstantControlsFromBoard(playerBoard);
        reRenderBoardByArray();
        selectedShip.remove();
        selectedShip = null;
        checkGameCanStart();
    }

    function clearInconstantControlsFromBoard(board=playerBoard){
        // usuwa z tablicy wszystkie komórki z wartościami niestałymi, czyli 2 i 3 symbolizujące możliwość lub nie ustawienia statku
        for (var tableRow = 0; tableRow < board.length; tableRow++){
            for (var tableColumn = 0; tableColumn  < board[tableRow].length; tableColumn++){
                if (board[tableRow][tableColumn] == 2 || board[tableRow][tableColumn] == 3){
                    board[tableRow][tableColumn] = 0;
                }
                else if (board[tableRow][tableColumn] == 4){    // change can not locate control when locating ship override located
                    board[tableRow][tableColumn] = 1;
                }
            }
        }
    }

    function initShipsToLoacate(){
        var shipsBlock = document.querySelector('.shipsToLocate');
        var shipCellSize = boardPXSize / boardSize
        for(var iter=0; iter<shipsLengths.length; iter++){
            var ship = makeShip(shipsLengths[iter], shipsBlock, shipCellSize)
            if(iter == 0){
                selectShip(ship);
            }
        }
    }

    function makeShip(len, shipsBlock, shipCellSize){
        var ship = document.createElement('div');
        ship.classList.add('ship');
        ship.classList.add('unselected');
        ship.style.width = (len * shipCellSize).toString() + "px";
        ship.style.height = shipCellSize.toString() + "px";
        ship.dataset.len = len;
        shipsBlock.appendChild(ship);
        //make ships cells
        for (var cellIter = 0; cellIter < len; cellIter ++){
            var cell = document.createElement('div');
            cell.classList.add('shipCell');
            cell.style.width = (shipCellSize - 2) + 'px';   // -2 beacuse of borders
            cell.style.height = (shipCellSize - 2) + 'px';
            cell.onclick = selectShipEvent;
            cell.onmouseover = mouseOverShipEvent;
            cell.onmouseout = mouseOutShipEvent;
            ship.appendChild(cell);
        }
        return ship
    }

    function selectShip(ship){   // funkcja służąca do zaznaczenia statku
        console.log(`Select ship: ${ship.dataset.len}`);
        if (selectedShip != null){
            selectedShip.classList.remove('selected');
            selectedShip.classList.add('unselected');
        }
        selectedShip = ship;
        ship.classList.remove('unselected');
        ship.classList.add('selected');
    }

    function selectShipEvent(e){
        selectShip(e.target.parentNode)
    }

    function mouseOverShipEvent(e){
        var ship = e.target.parentNode
        if (!ship.classList.contains('selected')){
            ship.classList.add('hover')
        }
    }

    function mouseOutShipEvent(e){
        var ship = e.target.parentNode
        ship.classList.remove('hover')
    }

    // pulling down ship

    function pullDownShip(e){
        if (selectedShip == null){
            e.target.removeEventListener('click', pullDownShip);
            var shipLen = pullDownShipFromTable(e.target.dataset.tableRow, e.target.dataset.tableColumn)
            var shipsBlock = document.querySelector('.shipsToLocate');
            var shipCellSize = boardPXSize / boardSize
            makeShip(shipLen, shipsBlock, shipCellSize)
            reRenderBoardByArray();
            checkGameCanStart();
        }
    }

    function pullDownShipFromTable(shipRow, shipColumn, board=playerBoard){
        var length = 0; // found ship length
        var posToChecked = [[parseInt(shipRow), parseInt(shipColumn)]]   //starting pos to delete
        while (posToChecked.length > 0){    // while ends when not find any more adjacent and not checked ship fields
            posToChecked.forEach(pos => {    // cleaning pos in board with finded ship blocks, to not find this pos in searching
                board[pos[0]][pos[1]] = 0;
                length ++;
            })
            var findedPos = [];     //array for finded pos in this checking
            posToChecked.forEach(pos => {   // for all position to check, checking and finding adjacent ship positions 
                var actualfindedCellshipRow = pos[0];
                var actualfindedCellshipColumn = pos[1];
                for (var tableRow = actualfindedCellshipRow - 1; tableRow <= actualfindedCellshipRow + 1; tableRow++){
                    for (var tableColumn = actualfindedCellshipColumn - 1; tableColumn  <= actualfindedCellshipColumn + 1; tableColumn++){
                        if (board[tableRow][tableColumn] == 1){
                            findedPos.push([tableRow, tableColumn]);
                        }
                    }
                }
            })
            posToChecked = [...findedPos];  // when pos is checked, that finded pos of ships blocks need to be checked and cleaned from 1 to 0 control in board 
        }
        return length;
    }

    function initChangeShipPosition(e){
        // załącza możliwość zmiany pozycji
        playerBoardParrent.addEventListener('contextmenu', (e) => {
            console.log('context menu event', settingPosition);
            e.preventDefault(); // zapobiega normalnemu zachowaniu
            settingPosition = settingPosition == 1 ? 0 : 1;     // zmienia kierunek na inny
            // czyści planszę z pokazanej możliwości ustawienia statku, aby pokazać nową
            clearInconstantControlsFromBoard();
            reRenderBoardByArray();
            // pokazuje nową opcję lokowania 
            if (selectedShip != null && actualBlock != null){
                displayLocationToBlock();
            }
        })
    }

    //starting main game

    function checkGameCanStart(){
        var shipsBlock = document.querySelector('.shipsToLocate');
        var startBtn = document.querySelector('#startBtn')
        if (shipsBlock.children.length == 0){
            startBtn.classList.remove('hidden');
        } else {
            startBtn.classList.add('hidden');
        }
    }

    function startBtnClick(e){
        console.log('Game started');
        e.target.onclick = null;
        e.target.classList.add('hidden');
        mainGameStarted = true;
        removeUnnecesaryPlayerBoardEvents();
        initBadMoveAlerts();
    }

    function removeUnnecesaryPlayerBoardEvents(){
        for (var iter = 0; iter < playerBoardParrent.children.length; iter++){
            var block = playerBoardParrent.children[iter];
            block.removeEventListener('click', pullDownShip);
            block.onmouseover = null;
            block.onmouseout = null;
        }
    }

    function initBadMoveAlerts(){
        computerBoardParrent.addEventListener('click', boardClick, true)
        playerBoardParrent.addEventListener('click', boardClick, true)
    }

    function removeBadMoveAlerts(){
        computerBoardParrent.removeEventListener('click', boardClick, true);
        playerBoardParrent.removeEventListener('click', boardClick, true);
    }

    function boardClick(e){
        if (playerTurn){
            if (playerBoardParrent == e.currentTarget){
                console.log('alert player move');
                alert('Ruch gracza');
            }
        } else if (computerBoardParrent == e.currentTarget){
            console.log('alert computer move');
            alert('Ruch komputera');
        }
    }

    //main game Functions

    function playerClickOnComputerCell(e){
        if (checkCanShot(e.target)){
            var block = e.target;
            var tableRow = parseInt(block.dataset.tableRow);
            var tableColumn = parseInt(block.dataset.tableColumn);
            shot(tableRow, tableColumn);
            if (!playerTurn){
                setTimeout(computerMove, 1000);
            }
        }
    }

    function checkCanShot(block){
        if (!block.classList.contains('block')) return false;
        if (!mainGameStarted) return false;
        if (! playerTurn) return false;
        var tableRow = block.dataset.tableRow;
        var tableColumn = block.dataset.tableColumn;
        if ((computerBoard[tableRow][tableColumn] == 6) || (computerBoard[tableRow][tableColumn] == 5)) return false;
        return true;
    }

    function computerMove(){
        var compShotPos = computerPrepareShot();
        var tr = compShotPos[0]
        var tc = compShotPos[1]
        var hit = shot(tr, tc, false);
        if (hit){
            computerKnowledgeBoard[tr][tc] = 1
            findedPlayerShipPos = [tr, tc]
            shotingShipLen ++;
        } else {
            computerKnowledgeBoard[tr][tc] = 2
        }
        console.log(`Computer maked turn tr ${tr} tc ${tc}, hit ${hit}`);
        console.log('computerKnowledgeBoard', computerKnowledgeBoard);
        if ((!playerTurn) && (mainGameStarted)){    // that mainGameStarted to not make move after computer win
            setTimeout(computerMove, 1000);
        }
    }

    function shot(row, column, byPlayer=true){
        console.log(`shot by ${byPlayer} player r ${row}, c${column}`);
        var board = byPlayer ? computerBoard : playerBoard
        var cell = board[row][column]
        var hit = false
        if (cell == 1){
            board[row][column] = 6
            hit = true;
        } else if ((cell == 5) || (cell == 6)){
            console.log('ERROR: Shot on that same cell');
        }
        else {
            board[row][column] = 5
        }
        if (hit){
            if (byPlayer){
                computerShipPoints --;
            } else {
                playerShipPoints --;
            }
            checkIfShipDestroyed(row, column, !byPlayer);
        }
        if (!hit){
            playerTurn = !playerTurn;
        }
        reRenderBoardByArray(!byPlayer);
        checkIfSomeoneLose();
        return hit;
    }

    function checkIfShipDestroyed(row, column, checkPlayerboard){     // to make underlines
        var board = checkPlayerboard ? playerBoard : computerBoard;
        var posToChecked = [[row, column]]   //starting pos to underline
        var allPos = [];
        var findNotHitCell = false;

        function checkIsPosInAllPos(pos){
            var is = false;
            allPos.forEach(aPos => {
                if ((aPos[0] == pos[0]) &&(aPos[1] == pos[1])){
                    is = true;
                }
            });
            return is;
        }

        while (posToChecked.length > 0){    // while ends when not find any more adjacent and not checked ship fields
            posToChecked.forEach(pos => {    // cleaning pos in board with finded ship blocks, to not find this pos in searching
                allPos.push(pos)
            })
            var findedPos = [];     //array for finded pos in this checking
            posToChecked.forEach(pos => {   // for all position to check, checking and finding adjacent ship positions 
                var actualfindedCellshipRow = pos[0];
                var actualfindedCellshipColumn = pos[1];
                for (var tableRow = actualfindedCellshipRow - 1; tableRow <= actualfindedCellshipRow + 1; tableRow++){  // double for checking pos around position pos
                    for (var tableColumn = actualfindedCellshipColumn - 1; tableColumn  <= actualfindedCellshipColumn + 1; tableColumn++){
                        if ((board[tableRow][tableColumn] == 6) && (!checkIsPosInAllPos([tableRow, tableColumn]))){      // if is ship hitten and that is new pos
                            findedPos.push([tableRow, tableColumn]);    // if find hited cell append to all pos list
                        } else if (board[tableRow][tableColumn] == 1){
                            findNotHitCell = true  // if find ship cell that not hit, not underlining
                            return false;
                        }
                    }
                }
            })
            posToChecked = [...findedPos];  // when pos is checked, that finded pos of ships blocks need to be checked and cleaned from 1 to 0 control in board 
        }

        if (! findNotHitCell){   // underlining if not find ship cell that is not hit
            var shipLen = 0
            allPos.forEach((pos) => {
                board[pos[0]][pos[1]] = 7;
                shipLen ++;
            })
        }
        return !findNotHitCell;
    }
    
    function computerPrepareShot(){
        // in this place are main computer AI to make good shots
        if (shotingShipLen >= playerRemainingShips[0]){
            computerKnowDestoryShip(playerRemainingShips[0]);
            var pos = normalComputerBehaviour()
            return pos
        }
        if (findedPlayerShipPos.length > 0){
            var pos = computerwhenHasShipToDestroy();
            if (pos == false){  // when something crash in computer AI
                pos = normalComputerBehaviour()
            }
            return pos;
        }
        var pos = normalComputerBehaviour()
        return pos
    }

    function computerKnowDestoryShip(shipLen){
        console.log('Computer destroy Ship at len', shipLen);
        findedPlayerShipPos = [];
        shotingShipLen = 0;
        var shipLenIdx = playerRemainingShips.indexOf(shipLen);
        playerRemainingShips.splice(shipLenIdx, 1);
    }

    function normalComputerBehaviour(){
        var tr;
        var tc;
        var shotCell;

        function posOk(){
            if ((shotCell == 1) || (shotCell == 2)) {return false}  // checking if shot in actual shoted cell

            for (var trIter = tr - 1; trIter <= tr + 1; trIter++){      //checking if shot near ship
                for (var tcIter = tc - 1; tcIter <= tc + 1; tcIter++){
                    var cell = computerKnowledgeBoard[trIter][tcIter];
                    if (cell == 1) {return false}
                }
            }

            var longestShip = playerRemainingShips[0]   //to finding pos whene most long ship can be located
            var mostMatchingLen = 0
            for (var trIter = tr - longestShip; trIter <= tr + longestShip; trIter++){  // loop for all vertical pos when probably ship can be
                if ((trIter < 1) || (trIter > 10)) {continue}
                var canLocate = true;
                
                for (var trIter2 = trIter - 1; trIter2 <= trIter + 1; trIter2++){   // loop checking for can ideally locate ship in that cell
                    for (var tcIter2 = tc - 1; tcIter2 <= tc + 1; tcIter2++){
                        var cellVar = computerKnowledgeBoard[trIter2][tcIter2]
                        if (cellVar == 1){ 
                            canLocate = false;
                            break;
                        }
                    }
                }

                var cellVar = computerKnowledgeBoard[trIter][tc]
                if ((canLocate) && (cellVar == 0)){
                    mostMatchingLen ++;
                } else {
                    mostMatchingLen = 0;
                }
                if (mostMatchingLen >= longestShip) {return true}
            }

            for (var tcIter = tc - longestShip; tcIter <= tc + longestShip; tcIter++){  // loop for all horizontal pos when probably ship can be
                if ((tcIter < 1) || (tcIter > 10)) {continue}
                var canLocate = true;

                for (var trIter2 = tr - 1; trIter2 <= tr + 1; trIter2++){       // loop checking for can ideally locate ship in that cell
                    for (var tcIter2 = tcIter - 1; tcIter2 <= tcIter + 1; tcIter2++){
                        var cellVar = computerKnowledgeBoard[trIter2][tcIter2]
                        if (cellVar == 1){ 
                            canLocate = false;
                            break;
                        }
                    }
                }

                var cellVar = computerKnowledgeBoard[tr][tcIter]
                if ((canLocate) && (cellVar == 0)){
                    mostMatchingLen ++;
                } else {
                    mostMatchingLen = 0;
                }
                if (mostMatchingLen >= longestShip) {return true}
            }
            return false;
        }

        var i = 0;
        do {
            i ++
            if (i > 80){ 
                console.log('ERROR: loop finding the best optimal position computer shot take too long');
                break;
            }
            tr = Math.round(Math.random() * 9) + 1;
            tc = Math.round(Math.random() * 9) + 1;
            shotCell = computerKnowledgeBoard[tr][tc];
        } while (!posOk());
        return [tr, tc];
    }

    function computerwhenHasShipToDestroy(){
        // returning pos to shot
        console.log('computerwhenHasShipToDestroy()');
        var fr = findedPlayerShipPos[0] // finded row
        var fc = findedPlayerShipPos[1] //finded column
        var positions = [[fr - 1, fc], [fr, fc + 1], [fr + 1, fc], [fr, fc - 1]]    // in system N, E, S, W
        var nearPosStatus = [computerKnowledgeBoard[positions[0][0]][positions[0][1]], computerKnowledgeBoard[positions[1][0]][positions[1][1]],
         computerKnowledgeBoard[positions[2][0]][positions[2][1]], computerKnowledgeBoard[positions[3][0]][positions[3][1]]]  
        // in system N, E, S, W, 0 - blank, 1 - hit, 2 - not hit, 3 - place when shouldn't locate, near other ship, beyond edge

        //init 3 control
        // loading near ship
        var posIter = 0;
        positions.forEach(position => {
            var tr = position[0];
            var tc = position[1];
            var mainCellVar = computerKnowledgeBoard[tr][tc]
            for (var trIter = tr - 1; trIter <= tr + 1; trIter++){       // loop checking for can ideally locate ship in that cell
                for (var tcIter = tc - 1; tcIter <= tc + 1; tcIter++){
                    if ((trIter >= 11) || (trIter <= 0)  || (tcIter >= 11) || (tcIter <= 0)) {continue}
                    var cellVar = computerKnowledgeBoard[trIter][tcIter]
                    if ((cellVar == 1) && (mainCellVar == 0) && ((tr != fr) && (tc != fc))){    // if checking to change control to 3 when in that cell is other ship   
                        nearPosStatus[posIter] = 3;
                    }
                }
            }
            posIter++;
        });

        // loading beyond edge
        if (fr - 1 <= 0){
            nearPosStatus[0] = 3
        }
        if (fc + 1 >= 11){
            nearPosStatus[1] = 3
        }
        if (fr + 1 >= 11){
            nearPosStatus[2] = 3
        }
        if (fc - 1 <= 0){
            nearPosStatus[3] = 3
        }

        var hitIndex = nearPosStatus.indexOf(1);
        if (hitIndex != -1){
            var otherSideIndex = (hitIndex + 2) % 4   // checking pos at other side
            var checkingVal = nearPosStatus[otherSideIndex]
            if (checkingVal == 0){  // if at other side is not trying shot, try
                console.log('returning pos', positions[otherSideIndex]);
                return positions[otherSideIndex]
            } else if (checkingVal == 1){   // this situation can not be true
                console.log('ERROR: checking pos has near 2 shoted positions');
                return false;
            } else {    // if find at other side not hit or edge, then check other end of ship
                var checkingPos = positions[hitIndex]
                var checkingVar = computerKnowledgeBoard[checkingPos[0]][checkingPos[1]]
                var shipLen = 1;
                while(checkingVar == 1){    // loop finding other end of ship
                    shipLen ++;
                    if (shipLen > 40) {console.log('ERROR: finding other end of ship take too long'); return false;}
                    switch (hitIndex) {
                        case 0:
                            checkingPos[0] --;
                            break;
                        case 1:
                            checkingPos[1] ++;
                            break;
                        case 2:
                            checkingPos[0] ++;
                            break;
                        case 3:
                            checkingPos[1] --;
                            break;
                    }
                    checkingVar = computerKnowledgeBoard[checkingPos[0]][checkingPos[1]]
                }
                if (checkingVar == 2){
                    computerKnowDestoryShip(shipLen);
                    return normalComputerBehaviour();
                }
                console.log('returning pos', checkingPos);
                return checkingPos  // returning first not ship pos
            }
        }

        // to know when they destory one-cell ship
        var haveBlank = nearPosStatus.includes(0);
        if (! haveBlank){
            computerKnowDestoryShip(1)
            return normalComputerBehaviour();
        }

        // when not find any hit
        var i = 0
        var randomHitVal
        var randomHitPos

        function randomHitOk(){
            if (randomHitVal != 0){return false};       // check if can shot in block

            var checkingPos = [positions[randomHitPos][0], positions[randomHitPos][1]]
            switch (randomHitPos) {     // check if next ship is on other side, if yes, then return false
                case 0:
                    checkingPos[0] --;
                    break;
                case 1:
                    checkingPos[1] ++;
                    break;
                case 2:
                    checkingPos[0] ++;
                    break;
                case 3:
                    checkingPos[1] --;
                    break;
            }
            if (computerKnowledgeBoard[checkingPos[0]][checkingPos[1]] == 1) {
                return false
            }
            return true;
        }

        do {
            i ++
            if (i > 40) {console.log('ERROR: finding random balank place around hit take too long'); return false;}
            randomHitPos = Math.round(Math.random() * 3);
            randomHitVal = nearPosStatus[randomHitPos];
        } while (!randomHitOk())

        console.log('returning pos', positions[randomHitPos]);
        return positions[randomHitPos];
    }

    function checkIfSomeoneLose(){
        if (computerShipPoints <= 0){
            computerLose();
        } else if (playerShipPoints <= 0){
            playerLose();
        }
    }

    function computerLose(){
        alert('Wygrałeś, kliknij ok celem rewanżu')
        reloadGame();
    }

    function playerLose(){
        alert('Niestety przegrałeś, spróbuj ponownie');
        reRenderBoardByArray(false, true);
        mainGameStarted = false;
        setTimeout(reloadGame, 3000);
    }

    function reloadGame(){
        console.log('reloading game');
        // removing boards In html
        var blocksToClean = [playerBoardParrent, computerBoardParrent];
        blocksToClean.forEach(element => {
            element.innerHTML = '';
        });

        // reload vars
        selectedShip = null;
        settingPosition = 0; //0 - poziom, 1 - pion
        playerBoard = [];
        computerBoard = [];
        // Znaczenie kontrolek w tablicy: 0 - puste pole, 1 - ustawiony statek, 2 - można ustawić statek, 3 - nie można ustwić statku
        // 5 - nietrafiony, 6 - trafiony
        actualBlock = null;
        mainGameStarted = false;
        playerTurn = true;
        playerShipPoints = 0;   // ship cells count in player board
        shipsLengths.map(el => playerShipPoints += el);
        computerShipPoints = playerShipPoints;

        removeBadMoveAlerts();
        prepareGame(false);
    }

    prepareGame();
}

document.addEventListener('DOMContentLoaded', start)