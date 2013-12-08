using FlickrNet;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using WitnessKingTides.Mobile.Web.Models;

namespace WitnessKingTides.Mobile.Web.Services
{
    public class FlickrService
    {
        static readonly string FlickrApiKey;
        static readonly string FlickrApiSecret;
        static readonly string AppDataDirectory;
        static readonly string FlickrOAuthKey;
        static readonly string FlickrOAuthSecret;

        static FlickrService()
        {
            FlickrApiKey = ConfigurationManager.AppSettings["Flickr-ApiKey"];
            FlickrApiSecret = ConfigurationManager.AppSettings["Flickr-ApiSecret"];
            FlickrOAuthKey = ConfigurationManager.AppSettings["Flickr-OAuthKey"];
            FlickrOAuthSecret = ConfigurationManager.AppSettings["Flickr-OAuthSecret"];
            AppDataDirectory = AppDomain.CurrentDomain.GetData("DataDirectory").ToString();
        }

        public string Upload(WitnessKingTidesApiInputModel model)
        {
            string flickrId = string.Empty;
            model.FileName = Guid.NewGuid().ToString() + ".jpg";

            var flickr = new Flickr(FlickrApiKey, FlickrApiSecret);
            flickr.OAuthAccessToken = FlickrOAuthKey;
            flickr.OAuthAccessTokenSecret = FlickrOAuthSecret;

            var path = Path.Combine(AppDataDirectory, model.FileName);
            using (var stream = File.OpenWrite(path))
            {
                stream.Write(model.Photo, 0, model.Photo.Length);
            }

            flickrId = flickr.UploadPicture(path, null, model.Description, null, true, false, false);

            File.Delete(path);

            return flickrId;
        }
    }
}