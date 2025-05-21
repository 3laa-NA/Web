import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import NavigationPanel from '../layout/NavigationPanel';
import Signin from '../auth/Signin';
import Dashboard from './Dashboard';

// Page principale simplifiée
// Affiche soit la page d'inscription soit le tableau de bord selon l'état de connexion
function MainPage() {
	const { user, login, logout } = useContext(AppContext);

	return (
		<>
			<NavigationPanel />
			<div>
				{!user ? 
					<Signin /> : 
					<Dashboard />
				}
			</div>
		</>
	);
}

export default MainPage;
