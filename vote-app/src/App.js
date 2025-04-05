
import { useEffect, useState } from 'react';
import './App.css';
import Election from './Election';
import { Box, Tab, Tabs } from '@mui/material';
import Web3 from "web3";


const year = new Date().getFullYear();

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [electeur, setElecteur] = useState('Vincent Angoulvant');
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const a11yProps = (index) => {
    return {
      id: `basic-tab-${index}`,
      'aria-controls': `basic-tabpanel-${index}`,
    };
  }

  // useEffect(() => {
  //   const init = async () => {
  //     if (window.ethereum) {
  //       await window.ethereum.request({ method: "eth_requestAccounts" });
  //       const web3 = new Web3(window.ethereum);

  //       const accounts = await web3.eth.getAccounts();
  //       setAccount(accounts[0]);

  //       const networkId = await web3.eth.net.getId();
  //       const deployedNetwork = Election.networks[networkId];
  //       const instance = new web3.eth.Contract(
  //         Election.abi,
  //         deployedNetwork && deployedNetwork.address
  //       );
  //       setContract(instance);

  //       const count = await instance.methods.candidatesCount().call();
  //       const candidateList = [];

  //       for (let i = 1; i <= count; i++) {
  //         const candidate = await instance.methods.candidates(i).call();
  //         candidateList.push(candidate);
  //       }

  //       setCandidates(candidateList);

  //       const voted = await instance.methods.voters(accounts[0]).call();
  //       setHasVoted(voted);

  //       setLoading(false);
  //     } else {
  //       alert("Please install MetaMask!");
  //     }
  //   };

  //   init();
  // }, []);

  // if (loading) return <div>Chargement...</div>;

  return (
    <div className="App">
      <header className='App-header'>
        <div className='app-title'>
          {'Election présidentiels ' + year}
        </div>
        <div className='app-tabs'>
          <Box >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
              <Tabs sx={{ width: '100%' }} value={tabValue} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Voter" {...a11yProps(0)} />
                <Tab color='error' label="Statistiques" {...a11yProps(1)} />
              </Tabs>
            </Box>
          </Box>
        </div>
      </header>
      <div className='app-content'>
        {electeur &&
          <div className='electeur'>
            {`Electeur : ${electeur}`}
          </div>
        }
        <Election year={year} tab={tabValue} />
      </div>
    </div>
  );
}

export default App;
