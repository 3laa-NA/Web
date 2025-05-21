import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import Dashboard from './Dashboard';
import Signin from '../auth/Signin';
import Login from '../auth/Login';
import PrivateMessages from '../private-messages/PrivateMessages';
import Profile from '../user/Profile';
import AdminPanel from '../admin/AdminPanel';

// Composant qui gère le contenu principal à afficher
// Détermine quel composant afficher en fonction de l'état de connexion et de la page actuelle
function MainContent() {
	const { user, currentPage } = useContext(AppContext);

	// Si l'utilisateur n'est pas connecté, afficher soit la page d'inscription soit la page de connexion
	if (!user) {
		return currentPage === 'signin' ? <Signin /> : <Login />;
	}
	
	// Si l'utilisateur est connecté, afficher la page correspondant à la navigation actuelle
	switch (currentPage) {
		case 'dashboard':
			return <Dashboard />;
		case 'messages':
			return <PrivateMessages />;
		case 'profile':
			return <Profile />;
		case 'admin':
			if (user.role === 'admin') {
				return <AdminPanel />;
			} else {
				return <Dashboard />;
			}
		default:
			return <Dashboard />;
	}
}

export default MainContent;
