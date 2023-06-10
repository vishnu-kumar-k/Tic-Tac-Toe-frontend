import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { Container, Button, Row, Col, Form } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import Confetti from 'react-confetti';


const socket = io("http://52.66.14.139:8000");

const App = () => {
  
  const [joinWithNumber, setJoinWithNumber] = useState(0);
  const [number, setNumber] = useState("");
  const [flag, setFlag] = useState(false);
  const [message, setMessage] = useState("");
  const [temp, setTemp] = useState();
  const clickRef = useRef(true);
  const [game, setGame] = useState(false);
  const [player, setPlayer] = useState();
  const [mymessage, setMymessage] = useState([]);
  const [friendmessage, setFriendmessage] = useState([]);
  const [messaget, setMessaget] = useState("");
  const [win,setWin]=useState(false);
  const bl="----------------------------";
  const [gameBoard, setGameBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);

  const vRef = useRef();
  const setVariable = (value) => {
    vRef.current = value;
  };

  

  useEffect(() => {
    socket.on("leaveGame", () => {
      if(game){
      setMessage("You have won the Game");
      toast.success("Player Has left");
      setWin(true);
      setTimeout(()=>
      {
        
        window.location.reload();
      },4000)
    }
    else
    {
      toast.info("Player Has left");
      
      setTimeout(()=>
      {
        
        window.location.reload();
      },4000)
    }
    });

    socket.on("waiting", () => {
      setMessage("Waiting for the Player");
    });

    socket.on("Error", () => {
      toast.warning("No Game Created");
    });

    socket.on("updateMessage", (m) => {
      setFriendmessage((prevMessage) => [...prevMessage, m]);
    });
    

    socket.on("startGame", async (temp, con, p) => {
      await setTemp(temp);
      await setPlayer(p);
      await setGame(true);
      setVariable(con);

      if (con === "O") {
        clickRef.current = false;
      }

      setMessage("Game Started");
      setFlag(true);
    });

    socket.on("updateGame", (newGameBoard) => {
      setGameBoard(newGameBoard);
      clickRef.current = true;
    });


    socket.on("gameWinner", (t) => {
      clickRef.current = false;
      setGame(false);
      
      if (t === vRef.current) {
        setWin(true);
        setMessage("You have Won");
      } else if (t === "draw") {
        setMessage("Match has been Drawn");
      } else {
        setMessage("You have Lost");
      }
    });

    
  }, []);

  const handleJoinWithNumber = () => {
    setJoinWithNumber(1);
  };

  const handleJoin = () => {
    setMessage("Loading.............");
    socket.emit("joinWithEnteredNumber", number);
  };

  function generateRandomNumber() {
    const min = 100000; // Minimum value (inclusive)
    const max = 999999; // Maximum value (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleRandomJoin = (e) => {
    e.preventDefault();
    setMessage("Waiting for Another Player");
    setJoinWithNumber(10);
    socket.emit("joinRandom");
  };

  const handleGenerateNumber = (e) => {
    e.preventDefault();
    setJoinWithNumber(3);
    const randomNumber = generateRandomNumber();
    setMessage(`Enter this number ${randomNumber}`);
    socket.emit("joinWithNumber", randomNumber);
  };

  const handleCellClick = (rowIndex, colIndex) => {
    console.log(clickRef.current);

    if (gameBoard[rowIndex][colIndex] === "" && clickRef.current) {
      // Make sure the cell is empty and the game has started
      const newGameBoard = [...gameBoard];
      newGameBoard[rowIndex][colIndex] = vRef.current; // Set the clicked cell to 'X' for the example
      setGameBoard(newGameBoard);
      clickRef.current = false;

      // Emit an event to update the game board on the server and notify the other player
      socket.emit("updateGameBoard", newGameBoard, temp, player);
    }

  };
  
  const handlemessage = async(e) => {
    e.preventDefault();
    socket.emit("Message", temp, player, messaget);
    await setMymessage((prevMessage) => [...prevMessage, messaget]);
    await setMessaget("");
  };

  return (
    <Container>
      <ToastContainer />
      {win?(<Confetti
      width={window.innerWidth-20}
      height={window.innerHeight-20}
    />):null}
      
      <h1 className="d-flex justify-content-center tittle">Tic Tac Toe</h1>
      {!flag ? (
        <>
          {joinWithNumber === 0 ? (
            <div className="d-flex justify-content-around">
              <Button onClick={handleJoinWithNumber}>Enter with Number</Button>
              <Button onClick={handleRandomJoin}>Join Random</Button>
              <Button onClick={handleGenerateNumber}>Generate Number</Button>
              </div>
          ) : null}

          {joinWithNumber === 1 ? (
            <>
              <Form.Group controlId="numberInput" className="d-flex justify-content-around">
                <Form.Label>Enter the same number Display on Friend</Form.Label>
                <Form.Control
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-around">
              <Button
              className="d-flex justify-content-center"
                variant="primary"
                style={{marginTop:"1em"}}
                onClick={handleJoin}
                disabled={!number || number.length !==6}
              >
                Join
              </Button>
              </div>
            </>
          ) : (
            <h1>{message}</h1>
          )}
        </>
      ) : (
        <div >
          <h3 className="d-flex justify-content-around">{message}</h3>
          {game?(<>
          {clickRef.current?(<h6 className="d-flex justify-content-around">Your Turn</h6>):(<h6 className="d-flex justify-content-around">Waiting for Friend</h6>)}
          </>):null}
          <div className="game-board">
            {gameBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="rows">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className="cells"
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="message">
            <Row>
              <Col md={2}></Col>
              <Col md={4}>
                <h4>My Chat</h4>
                {mymessage.map((message, index) => (
                  <div key={index}>{message}</div>
                ))}
              </Col>
              <Col md={4}>
                <h4>Player Chat</h4>
                {friendmessage.map((message, index) => (
                  <div
                    key={index}
                    className={index % 2 === 0 ? "left" : "right"}
                  >
                   {index%2===0?(<>{message}</>):(null)} 
                  </div>
                ))}
              </Col>
              <Col md={2}></Col>
              <Form.Group controlId="messageInput" className="w-100">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={messaget}
                  onChange={(e) => setMessaget(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handlemessage}
                disabled={!messaget}
              >
                Send
              </Button>
            </Row>
          </div>
        </div>
      )}
    </Container>
  );
};

export default App;
