
interface MenuItem {
    name: string,
    href?: string,
    onClick?: CallableFunction,
    items?: MenuItem[],
}
type MenuItems = MenuItem[]

export const menuItems: MenuItems = [
    
    {
        name: 'Pacienti',
        href: '/#',
        items: [
            {
                name: 'Analize medicale si preturi',
                items: [
                    { name: 'Teste A-Z' },
                    { name: 'Pachete analize medicale' },
                    { name: 'Senzorul de sanatate' },
                    { name: 'Plansa anatomica' },
                    { name: 'Oferte speciale' },
                ],
            },
            {
                name: 'Atelierul de sanatate',
                items: [
                    { name: 'Sfatul medicului' },
                    { name: 'Sanatatea sub microscop' },
                    { name: 'Sanatatea prenatala' },
                    { name: 'Revista noastra' },
                ],
            },
            {
                name: 'Informatii utile',
                items: [
                    { name: 'Ultimele stiri' },
                    { name: 'Pregatirea pentru analize' },
                    { name: 'Intrebari frecvente' },
                    { name: 'Asiguratii CAS' },
                    { name: 'Locatii' },
                ],
            },
        ],
    },
    {
        name: 'Medici',
        items: [
            {
                name: 'Dictionar Medical',
                items: [
                    { name: 'Teste A-Z' },
                    { name: 'Profile afectiuni' },
                ],
            },
            {
                name: 'Informatii medicale',
                items: [
                    { name: 'Stiri' },
                    { name: 'Statistici' },
                    { name: 'Articole' },
                    { name: 'Evenimente' },
                    { name: 'Jurnal de laborator' },
                ],
            },
            {
                name: 'Colaborare',
                items: [
                    { name: 'Despre noi' },
                    { name: 'Medicii nostri' },
                    { name: 'Certificari, acreditari si aparatura' },
                    { name: 'Cere o oferta' },
                ],
            },
        ],
    },
    {
        name: 'Despre noi',
        items: [
            { name: 'Compania' },
            { name: 'Locatii' },
            { name: 'Laboratorul Central de Referinta' },
            { name: 'Presa' },
            { name: 'Satisfactia Clientului' },
            { name: 'Cariere' },
        ],
    },
    { name: 'Contact' },
    
];
