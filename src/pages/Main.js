import React, { useState, useContext, useEffect } from 'react'
import CardView from '../components/items/CardView'
import globalContenxt from '../utils/globalContenxt'
import Helper from '../utils/Helper'
import axios from 'axios'
import './Main.css'
import ResponsivePagination from 'react-responsive-pagination';
import 'react-responsive-pagination/themes/classic.css';

function Main() {
    const [KomikUpdate, setKomikUpdate] = useState([])
    const [KomikRekom, setKomikRekom] = useState([])
    const [KomikMOORA, setKomikMOORA] = useState([])
    const [KomikSearch, setKomikSearch] = useState([])
    const { globalData, setglobalData } = useContext(globalContenxt);
    const [LoadingUpdateComponent, setLoadingUpdateComponent] = useState(false)
    const [LoadingSimilarity, setLoadingSimilarity] = useState(false)
    const [columns, setColumns] = useState(2)
    const queryParameters = new URLSearchParams(window.location.search)
    const Page = queryParameters.get("page")
    const [currentPage, setCurrentPage] = useState(Page ? parseInt(Page) : 1)
    const [totalPages, settotalPages] = useState(0)
    let config = {
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
        }),
    }

    async function get_updated_komik(page){
        setLoadingUpdateComponent(true)

        let url = ``
        switch (globalData.extention) {
            case 'komikcast':
                url = `${globalData.api}/komikcast-update?page=${page}`
                break;
            case 'westmanga':
                url = `${globalData.api}/westmanga-update?page=${page}`
                break;
            case 'mangadex':
                url = `${globalData.api}/mangadex-update?page=${page}`
                break;
            default:
                break;
        }
    
        await axios.get(url, config)
        .then(response => {
            
            settotalPages(parseInt(response.data['pagination']))
            setKomikUpdate(response.data['data'])
            setLoadingUpdateComponent(false)
        })
        .catch(error => {
            setLoadingUpdateComponent(false)
            Helper.AlertInfo('Error fetching data', error)
            console.error('Error fetching data:', error);
        });
    }

    async function komik_reference(title) {
        document.getElementById('search-komik').value = title
        document.getElementById('form-search').requestSubmit();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    async function search_komik_recommedation(event) {
        event.preventDefault();

        let formData = new FormData(document.getElementById('form-search'));
        let jsonData = {};
        for (let [key, value] of formData.entries()) {
            jsonData[key] = value;
        }

        const Criteria = {}
        Object.entries(jsonData).forEach(([key, value]) => {
            if(key != 'title'){
                let weight = value != '' ? parseInt(value) : 0
                const Svalue = Math.sign(weight) == -1 ? 0 : 1
                Criteria[key] = [Svalue, Math.abs(weight)]
            }
        })

        const RequestData = {
            'title': jsonData['title'],
            'criteria': JSON.stringify(Criteria)
        }

        document.getElementById('komik-rekomendasi').style = 'display: block;'
        setLoadingSimilarity(true)
        await axios.get(`${globalData.api}/reckomik`, {params: RequestData, ...config})
        .then(response => {
            
            const ContentFilterBase = JSON.parse(response.data['CONTENT-BASED-FILTERING'])
            const MOORA = JSON.parse(response.data['MOORA'])

            console.log(ContentFilterBase);
            console.log(MOORA);
            
            setKomikMOORA(MOORA)
            // const komikSearchData = ContentFilterBase.filter(item => item.title === jsonData['title']);
            setKomikSearch([ContentFilterBase[0]])
            setKomikRekom(ContentFilterBase.slice(1))
            
            setLoadingSimilarity(false)
        })
        .catch(error => {
            setLoadingSimilarity(false)
            Helper.AlertInfo('Error fetching data', error)
            console.error('Error fetching data:', error);
        });
    }

    async function pagination_komik(newPage) {
        setCurrentPage(newPage) 
        get_updated_komik(newPage)

        console.log(newPage);
        
        const url = new URL(window.location);
        url.searchParams.set('page', currentPage);
    }

    useEffect(() => {
        if(globalData.api) {
            document.getElementById('komik-rekomendasi').style = 'display: none;'
            get_updated_komik(currentPage)            
        }
        
    }, [globalData])

    useEffect(() => {
        const url = new URL(window.location);
        url.searchParams.set('page', currentPage);
        window.history.pushState({}, '', url);
    }, [currentPage]);


    return (
        <>
            <div className="full-row p-2" style={{marginTop: '52px'}}>
                <div className="container">
                    <div>
                        <form onSubmit={search_komik_recommedation} id="form-search">
                            <div className="input-group mt-3">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Search your komik and we should recommend you..." 
                                    aria-label="Search your komik and we should recommend you..." 
                                    aria-describedby="btn-komik-search"
                                    id='search-komik'
                                    name='title'
                                    style={{borderBottom: '2px solid #dee2e6'}}
                                    required
                                />
                                <button 
                                    type="submit"    
                                    className="btn btn-outline-success" 
                                    id="btn-komik-search"
                                >
                                        <i className="fas fa-search"></i>
                                </button>
                            </div>
                            <table className='table'>
                                <tbody>
                                    <tr style={{textAlign: 'center !important', height: 'auto', verticalAlign: 'middle'}}>
                                        <th style={{width:'80px'}}>Image Similarity</th>
                                        <td style={{width:'20px'}}>
                                            <input className='form-control form-input' name='image_similarity' type='number' placeholder='0'/>
                                        </td>
                                        <th style={{width:'80px'}}>Description Similarity</th>
                                        <td style={{width:'20px'}}>
                                            <input className='form-control form-input' name='description_similarity' type='number' placeholder='0'/>
                                        </td>
                                        <th style={{width:'80px'}}>Rate</th>
                                        <td style={{width:'20px'}}>
                                            <input className='form-control form-input' name='rate' type='number' placeholder='0'/>
                                        </td>
                                        <th style={{width:'80px'}}>Genre Similarity</th>
                                        <td style={{width:'20px'}}>
                                            <input className='form-control form-input' name='genre_similarity' type='number' placeholder='0'/>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </form>
                    </div>
                </div>
            </div>

            <div className="full-row p-3" id="komik-rekomendasi" style={{display: 'none'}}>
                <div className="container" style={{overflowX: 'auto'}}>
                    <div className="row">
                        <div className="col-lg-8 col-md-8">
                            <h2 className="mb-4">Komik Search</h2>
                            <button className="btn btn-primary"></button>
                        </div>
                    </div>
                    <div className="row flex-nowrap" style={{height: "auto"}}>
                        {LoadingSimilarity ? 
                            <div className="row justify-content-center align-items-center bg-light" style={{height: "auto"}}>
                                {Helper.componentLoading()}
                            </div>
                        : null}

                        {!LoadingSimilarity && KomikSearch.map((komik, index) => (
                            <CardView 
                                key={index} 
                                title={komik?.title}
                                alt_title={komik?.alt_title}
                                type={komik?.type}
                                description={komik?.description}
                                genre={komik?.genre}
                                author={komik?.author}
                                artist={komik?.artist}
                                rate={komik?.rate}
                                image={komik?.image}
                                released={komik?.released}
                                comic_url={komik?.comic_url}
                                rank={komik?.rank ? komik?.rank : parseInt(index)+1}
                                col={columns}
                                onButtonClick = {() => komik_reference(komik?.title)}
                            />
                        ))}
                    </div>
                </div>

                <div className="container" style={{overflowX: 'auto'}}>
                    <div className="row">
                        <div className="col-lg-8 col-md-8">
                            <h2 className="mb-4">Komik CONTENT BASE FILTERING</h2>
                            <button className="btn btn-primary"></button>
                        </div>
                    </div>
                    {/* justify-content-center align-items-center */}
                    <div className="row flex-nowrap" style={{height: "auto"}}>
                        {LoadingSimilarity ? 
                            <div className="row justify-content-center align-items-center bg-light" style={{height: "auto"}}>
                                {Helper.componentLoading()}
                            </div>
                        : null}

                        {!LoadingSimilarity && KomikRekom.map((komik, index) => (
                            <CardView 
                                key={index} 
                                title={komik?.title}
                                alt_title={komik?.alt_title}
                                type={komik?.type}
                                description={komik?.description}
                                genre={komik?.genre}
                                author={komik?.author}
                                artist={komik?.artist}
                                rate={komik?.rate}
                                image={komik?.image}
                                released={komik?.released}
                                comic_url={komik?.comic_url}
                                rank={komik?.rank ? komik?.rank : parseInt(index)+1}
                                col={columns}
                                onButtonClick = {() => komik_reference(komik?.title)}
                            />
                        ))}
                    </div>
                </div>

                <div className="container mt-5" style={{overflowX: 'auto'}}>
                    <div className="row">
                        <div className="col-lg-8 col-md-8">
                            <h2 className="mb-4">Komik MOORA</h2>
                            <button className="btn btn-primary"></button>
                        </div>
                    </div>
                    {/* justify-content-center align-items-center */}
                    <div className="row flex-nowrap" style={{height: "auto"}}>
                        {LoadingSimilarity ? 
                            <div className="row justify-content-center align-items-center bg-light" style={{height: "auto"}}>
                                {Helper.componentLoading()}
                            </div>
                        : null}

                        {!LoadingSimilarity && KomikMOORA.map((komik, index) => (
                            <CardView 
                                key={index} 
                                title={komik?.title}
                                alt_title={komik?.alt_title}
                                type={komik?.type}
                                description={komik?.description}
                                genre={komik?.genre}
                                author={komik?.author}
                                artist={komik?.artist}
                                rate={komik?.rate}
                                image={komik?.image}
                                released={komik?.released}
                                comic_url={komik?.comic_url}
                                rank={komik?.rank ? komik?.rank : parseInt(index)+1}
                                col={columns}
                                onButtonClick = {() => komik_reference(komik?.title)}
                            />
                        ))}
                    </div>
                </div>

            </div>

            <div className="full-row p-3">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 col-md-8">
                            <h2 className="mb-4">
                                Komik Updated 
                                <button 
                                    onClick={get_updated_komik}
                                    className="btn btn-small ml-2" style={{borderRadius:'25px'}}
                                >
                                    <i className="fas fa-sync-alt hover-bg-primary"></i>
                                </button>
                            </h2>
                        </div>
                    </div>
                    <div className="row justify-content-center align-items-center" style={{height: "auto"}}>
                        {LoadingUpdateComponent ? 
                            <div className="row justify-content-center align-items-center bg-light" style={{height: "auto"}}>
                                {Helper.componentLoading()}
                            </div>
                        : null}

                        {!LoadingUpdateComponent && KomikUpdate.map((komik, index) => (
                            <CardView 
                                key={index} 
                                title={komik.title}
                                alt_title={komik.alt_title}
                                type={komik.type}
                                description={komik.description}
                                genre={komik.genre}
                                author={komik.author}
                                artist={komik.artist}
                                rate={komik.rate}
                                image={komik.image}
                                released={komik.released}
                                comic_url={komik.comic_url}
                                col={columns}
                                onButtonClick = {() => komik_reference(komik?.title)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="full-row p-3">
                <div className="container">
                    <ResponsivePagination
                        current={currentPage}
                        total={totalPages}
                        onPageChange={pagination_komik}
                        maxWidth={500}
                    />
                </div>
            </div>
        </>
    )
}

export default Main