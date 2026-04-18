import ReactGA from 'react-ga4';

export const initGA = () => {
    // Replace with your actual GA4 Measurement ID
    ReactGA.initialize('G-XXXXXXXXXX');
};

export const logEvent = (category: string, action: string, label?: string) => {
    ReactGA.event({
        category,
        action,
        label
    });
};

export const logPageView = () => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};
